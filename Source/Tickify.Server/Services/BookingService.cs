using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Tickify.Data;
using Tickify.DTOs.Booking;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ITicketRepository _ticketRepository;
    private readonly ISeatRepository _seatRepository;
    private readonly IPromoCodeRepository _promoCodeRepository;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<BookingService> _logger;

    public BookingService(
        IBookingRepository bookingRepository,
        ITicketRepository ticketRepository,
        ISeatRepository seatRepository,
        IPromoCodeRepository promoCodeRepository,
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<BookingService> logger)
    {
        _bookingRepository = bookingRepository;
        _ticketRepository = ticketRepository;
        _seatRepository = seatRepository;
        _promoCodeRepository = promoCodeRepository;
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<BookingDto> GetByIdAsync(int id)
    {
        var booking = await _bookingRepository.GetByIdAsync(id);
        if (booking == null)
            throw new NotFoundException($"Booking with ID {id} not found");

        return _mapper.Map<BookingDto>(booking);
    }

    public async Task<BookingDto> GetByBookingCodeAsync(string bookingCode)
    {
        var booking = await _bookingRepository.GetByBookingCodeAsync(bookingCode);
        if (booking == null)
            throw new NotFoundException($"Booking with code {bookingCode} not found");

        return _mapper.Map<BookingDto>(booking);
    }

    public async Task<IEnumerable<BookingListDto>> GetByUserIdAsync(int userId)
    {
        var bookings = await _bookingRepository.GetByUserIdAsync(userId);
        return _mapper.Map<IEnumerable<BookingListDto>>(bookings);
    }

    public async Task<IEnumerable<BookingListDto>> GetByEventIdAsync(int eventId)
    {
        var bookings = await _bookingRepository.GetByEventIdAsync(eventId);
        return _mapper.Map<IEnumerable<BookingListDto>>(bookings);
    }

    public async Task<BookingConfirmationDto> CreateBookingAsync(CreateBookingDto createBookingDto, int userId)
    {
        // Validate user exists
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            throw new NotFoundException($"User with ID {userId} not found. Please log in again.");

        // Get ticket type to calculate price
        var ticketType = await _context.TicketTypes
            .FirstOrDefaultAsync(tt => tt.Id == createBookingDto.TicketTypeId && tt.EventId == createBookingDto.EventId);
        
        if (ticketType == null)
            throw new NotFoundException($"Ticket type {createBookingDto.TicketTypeId} not found for event {createBookingDto.EventId}");
        
        if (!ticketType.IsActive)
            throw new BadRequestException("Ticket type is not active");
        
        if (ticketType.AvailableQuantity < createBookingDto.Quantity)
            throw new BadRequestException($"Not enough tickets available. Available: {ticketType.AvailableQuantity}, Requested: {createBookingDto.Quantity}");

        // Validate seat availability and calculate price from seats if provided
        decimal subtotal;
        
        if (createBookingDto.SeatIds?.Any() == true)
        {
            if (createBookingDto.SeatIds.Count != createBookingDto.Quantity)
                throw new BadRequestException("Number of seats must match quantity");

            // Get actual seat prices from database
            var selectedSeats = await _context.Seats
                .Where(s => createBookingDto.SeatIds.Contains(s.Id))
                .Include(s => s.SeatZone)
                .Include(s => s.TicketType)
                .ToListAsync();

            if (selectedSeats.Count != createBookingDto.SeatIds.Count)
                throw new BadRequestException("One or more seat IDs are invalid");

            // Validate all seats belong to the same event
            var eventIds = selectedSeats.Select(s => s.TicketType.EventId).Distinct().ToList();
            if (eventIds.Count > 1 || eventIds[0] != createBookingDto.EventId)
                throw new BadRequestException("All seats must belong to the same event");

            // Reserve seats (this will fail if any seat is not available)
            var seatsReserved = await _seatRepository.ReserveSeatsAsync(createBookingDto.SeatIds, userId);
            if (!seatsReserved)
                throw new BadRequestException("One or more seats are not available");

            // Calculate subtotal from actual seat prices (from zones)
            subtotal = selectedSeats.Sum(s => s.SeatZone?.ZonePrice ?? s.TicketType.Price);
        }
        else
        {
            // Regular booking without specific seats - use ticket type price
            subtotal = ticketType.Price * createBookingDto.Quantity;
        }
        
        // Calculate service fee (5% như frontend)
        // TODO: Nên lấy từ configuration thay vì hardcode
        const decimal SERVICE_FEE_PERCENTAGE = 0.05m;
        decimal serviceFee = subtotal * SERVICE_FEE_PERCENTAGE;
        
        // Total amount = subtotal + service fee
        decimal totalAmount = subtotal + serviceFee;

        // Validate and apply promo code if provided
        // Lưu ý: Discount chỉ áp dụng cho subtotal (giá vé), KHÔNG áp dụng cho service fee
        decimal discount = 0;
        int? promoCodeId = null;
        if (!string.IsNullOrEmpty(createBookingDto.PromoCode))
        {
            var promoCode = await _promoCodeRepository.GetByCodeAsync(createBookingDto.PromoCode);
            if (promoCode == null || !await _promoCodeRepository.IsPromoCodeValidAsync(createBookingDto.PromoCode, createBookingDto.EventId))
                throw new BadRequestException("Invalid or expired promo code");

            promoCodeId = promoCode.Id;

            // Calculate discount - chỉ áp dụng cho subtotal (giá vé), không áp dụng cho service fee
            if (promoCode.DiscountPercent.HasValue)
                discount = subtotal * (promoCode.DiscountPercent.Value / 100);
            else if (promoCode.DiscountAmount.HasValue)
                discount = promoCode.DiscountAmount.Value;
            
            // Đảm bảo discount không vượt quá subtotal
            if (discount > subtotal)
                discount = subtotal;
        }
        
        // Final total = subtotal - discount + service fee
        // Service fee luôn được tính, không bị discount
        decimal finalAmount = subtotal - discount + serviceFee;

        // Sử dụng transaction để đảm bảo data consistency
        _logger.LogInformation("Bắt đầu tạo booking cho UserId: {UserId}, EventId: {EventId}, Quantity: {Quantity}", 
            userId, createBookingDto.EventId, createBookingDto.Quantity);
        
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Create booking
            // TotalAmount bao gồm: subtotal - discount + service fee
            var booking = new Booking
            {
                UserId = userId,
                EventId = createBookingDto.EventId,
                BookingCode = GenerateBookingCode(),
                TotalAmount = finalAmount, // Đã bao gồm service fee
                DiscountAmount = discount,
                PromoCodeId = promoCodeId,
                Status = BookingStatus.Pending,
                BookingDate = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // 15 minutes to complete payment
                SeatIdsJson = createBookingDto.SeatIds?.Any() == true 
                    ? System.Text.Json.JsonSerializer.Serialize(createBookingDto.SeatIds) 
                    : null
            };
            
            _logger.LogInformation("Tính toán booking amount - Subtotal: {Subtotal}, ServiceFee: {ServiceFee}, Discount: {Discount}, FinalAmount: {FinalAmount}", 
                subtotal, serviceFee, discount, finalAmount);

            var createdBooking = await _bookingRepository.CreateAsync(booking);
            _logger.LogInformation("Đã tạo booking {BookingId} với code {BookingCode}", 
                createdBooking.Id, createdBooking.BookingCode);

            // Update ticket type available quantity (reserve tickets)
            if (createBookingDto.SeatIds?.Any() == true)
            {
                // For seat-based booking: update all affected ticket types
                var selectedSeats = await _context.Seats
                    .Where(s => createBookingDto.SeatIds.Contains(s.Id))
                    .Include(s => s.TicketType)
                    .ToListAsync();

                var ticketTypeGroups = selectedSeats.GroupBy(s => s.TicketTypeId);
                foreach (var group in ticketTypeGroups)
                {
                    var tt = group.First().TicketType;
                    tt.AvailableQuantity -= group.Count();
                    _context.TicketTypes.Update(tt);
                    _logger.LogInformation("Đã cập nhật số lượng ticket type {TicketTypeId}: AvailableQuantity = {AvailableQuantity}", 
                        tt.Id, tt.AvailableQuantity);
                }
            }
            else
            {
                // For regular booking: update single ticket type
                ticketType.AvailableQuantity -= createBookingDto.Quantity;
                _context.TicketTypes.Update(ticketType);
                _logger.LogInformation("Đã cập nhật số lượng ticket type {TicketTypeId}: AvailableQuantity = {AvailableQuantity}", 
                    ticketType.Id, ticketType.AvailableQuantity);
            }
            
            await _context.SaveChangesAsync();

            // Increment promo code usage if applied
            if (promoCodeId.HasValue)
            {
                await _promoCodeRepository.IncrementUsageAsync(promoCodeId.Value);
                _logger.LogInformation("Đã tăng usage cho promo code {PromoCodeId}", promoCodeId.Value);
            }

            // Commit transaction
            await transaction.CommitAsync();
            _logger.LogInformation("Transaction committed thành công cho booking {BookingId}", createdBooking.Id);

            // Reload booking with related entities for mapping
            var bookingWithDetails = await _bookingRepository.GetByIdAsync(createdBooking.Id);
            
            return _mapper.Map<BookingConfirmationDto>(bookingWithDetails);
        }
        catch (Exception ex)
        {
            // Rollback transaction nếu có lỗi
            _logger.LogError(ex, "Lỗi khi tạo booking, đang rollback transaction. UserId: {UserId}, EventId: {EventId}", 
                userId, createBookingDto.EventId);
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<BookingDto> CancelBookingAsync(int bookingId, CancelBookingDto cancelBookingDto, int userId)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        if (booking == null)
            throw new NotFoundException($"Booking with ID {bookingId} not found");

        if (booking.UserId != userId)
            throw new UnauthorizedException("You are not authorized to cancel this booking");

        if (booking.Status == BookingStatus.Cancelled)
            throw new BadRequestException("Booking is already cancelled");

        if (booking.Status == BookingStatus.Confirmed)
            throw new BadRequestException("Cannot cancel a confirmed booking. Please request a refund instead.");

        // Sử dụng transaction để đảm bảo data consistency
        _logger.LogInformation("Bắt đầu hủy booking {BookingId} cho UserId: {UserId}", bookingId, userId);
        
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = cancelBookingDto.CancellationReason;
            booking.CancelledAt = DateTime.UtcNow;

            // Release seats
            var tickets = await _ticketRepository.GetByBookingIdAsync(bookingId);
            var seatIds = tickets.Where(t => t.SeatId.HasValue).Select(t => t.SeatId!.Value);
            if (seatIds.Any())
            {
                await _seatRepository.AdminReleaseSeatsAsync(seatIds);
                _logger.LogInformation("Đã release {SeatCount} seats cho booking {BookingId}", seatIds.Count(), bookingId);
            }

            var updatedBooking = await _bookingRepository.UpdateAsync(booking);
            _logger.LogInformation("Đã cập nhật booking {BookingId} thành Cancelled", bookingId);
            
            // Commit transaction
            await transaction.CommitAsync();
            _logger.LogInformation("Transaction committed thành công cho cancel booking {BookingId}", bookingId);
            
            return _mapper.Map<BookingDto>(updatedBooking);
        }
        catch (Exception ex)
        {
            // Rollback transaction nếu có lỗi
            _logger.LogError(ex, "Lỗi khi hủy booking {BookingId}, đang rollback transaction", bookingId);
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<BookingDetailDto> GetBookingDetailsAsync(int bookingId, int userId)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        if (booking == null)
            throw new NotFoundException($"Booking with ID {bookingId} not found");

        if (booking.UserId != userId)
            throw new UnauthorizedException("You are not authorized to view this booking");

        return _mapper.Map<BookingDetailDto>(booking);
    }

    public async Task<IEnumerable<BookingListDto>> GetUserBookingHistoryAsync(int userId)
    {
        var bookings = await _bookingRepository.GetByUserIdAsync(userId);
        return _mapper.Map<IEnumerable<BookingListDto>>(bookings);
    }

    public async Task<BookingDto> UpdateBookingStatusAsync(int bookingId, string status)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        if (booking == null)
            throw new NotFoundException($"Booking with ID {bookingId} not found");

        if (!Enum.TryParse<BookingStatus>(status, out var bookingStatus))
            throw new BadRequestException($"Invalid booking status: {status}");

        booking.Status = bookingStatus;
        var updatedBooking = await _bookingRepository.UpdateAsync(booking);
        return _mapper.Map<BookingDto>(updatedBooking);
    }

    public async Task HandleExpiredBookingsAsync()
    {
        var expiredBookings = await _bookingRepository.GetExpiredBookingsAsync();
        
        foreach (var booking in expiredBookings)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = "Booking expired - payment not completed within time limit";
            booking.CancelledAt = DateTime.UtcNow;

            // Release seats
            var tickets = await _ticketRepository.GetByBookingIdAsync(booking.Id);
            var seatIds = tickets.Where(t => t.SeatId.HasValue).Select(t => t.SeatId!.Value);
            if (seatIds.Any())
            {
                await _seatRepository.AdminReleaseSeatsAsync(seatIds);
            }

            await _bookingRepository.UpdateAsync(booking);
        }
    }

    public async Task<BookingDto> ApplyPromoCodeAsync(int bookingId, string promoCode, int userId)
    {
        // Get booking with navigation properties
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        if (booking == null)
            throw new NotFoundException($"Booking with ID {bookingId} not found");

        // Verify ownership
        if (booking.UserId != userId)
            throw new ForbiddenException("You don't have permission to modify this booking");

        // Only pending bookings can apply promo codes
        if (booking.Status != BookingStatus.Pending)
            throw new BadRequestException("Promo codes can only be applied to pending bookings");

        // Get promo code
        var promo = await _promoCodeRepository.GetByCodeAsync(promoCode);
        if (promo == null)
            throw new NotFoundException($"Promo code '{promoCode}' not found");

        // Validate promo code (dates, max uses, minimum purchase, event-specific)
        if (!promo.IsActive)
            throw new BadRequestException("Promo code is not active");

        if (promo.ValidFrom.HasValue && DateTime.UtcNow < promo.ValidFrom.Value)
            throw new BadRequestException("Promo code is not yet valid");

        if (promo.ValidTo.HasValue && DateTime.UtcNow > promo.ValidTo.Value)
            throw new BadRequestException("Promo code has expired");

        if (promo.MaxUses.HasValue && promo.CurrentUses >= promo.MaxUses.Value)
            throw new BadRequestException("Promo code has reached maximum uses");

        if (promo.MinimumPurchase.HasValue && booking.TotalAmount < promo.MinimumPurchase.Value)
            throw new BadRequestException($"Minimum purchase of {promo.MinimumPurchase:C} required to use this promo code");

        if (promo.EventId.HasValue && promo.EventId.Value != booking.EventId)
            throw new BadRequestException("Promo code is not valid for this event");

        // Calculate discount
        decimal discountAmount = 0;
        if (promo.DiscountPercent.HasValue)
        {
            discountAmount = booking.TotalAmount * (promo.DiscountPercent.Value / 100);
        }
        else if (promo.DiscountAmount.HasValue)
        {
            discountAmount = promo.DiscountAmount.Value;
        }

        // Ensure discount doesn't exceed total amount
        if (discountAmount > booking.TotalAmount)
            discountAmount = booking.TotalAmount;

        // Sử dụng transaction để đảm bảo data consistency
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Apply discount
            booking.PromoCodeId = promo.Id;
            booking.DiscountAmount = discountAmount;

            // Increment promo code usage
            await _promoCodeRepository.IncrementUsageAsync(promo.Id);

            // Update booking
            await _bookingRepository.UpdateAsync(booking);

            // Commit transaction
            await transaction.CommitAsync();

            return _mapper.Map<BookingDto>(booking);
        }
        catch (Exception)
        {
            // Rollback transaction nếu có lỗi
            await transaction.RollbackAsync();
            throw;
        }
    }

    private string GenerateBookingCode()
    {
        return $"BK{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }
}
