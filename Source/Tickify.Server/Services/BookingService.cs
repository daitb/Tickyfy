using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;
using System.Text.Json;
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

    public BookingService(
        IBookingRepository bookingRepository,
        ITicketRepository ticketRepository,
        ISeatRepository seatRepository,
        IPromoCodeRepository promoCodeRepository,
        ApplicationDbContext context,
        IMapper mapper)
    {
        _bookingRepository = bookingRepository;
        _ticketRepository = ticketRepository;
        _seatRepository = seatRepository;
        _promoCodeRepository = promoCodeRepository;
        _context = context;
        _mapper = mapper;
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
        // Use Serializable transaction to prevent race conditions and overbooking
        using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        
        try
        {
            // Get ticket type to calculate price (with row locking)
            var ticketType = await _context.TicketTypes
                .FirstOrDefaultAsync(tt => tt.Id == createBookingDto.TicketTypeId && tt.EventId == createBookingDto.EventId);
            
            if (ticketType == null)
                throw new NotFoundException($"Ticket type {createBookingDto.TicketTypeId} not found for event {createBookingDto.EventId}");
            
            if (!ticketType.IsActive)
                throw new BadRequestException("Ticket type is not active");
            
            // Check availability INSIDE transaction to prevent race conditions
            if (ticketType.AvailableQuantity < createBookingDto.Quantity)
                throw new BadRequestException($"Not enough tickets available. Available: {ticketType.AvailableQuantity}, Requested: {createBookingDto.Quantity}");

            // Calculate original amount (before any discounts)
            decimal originalAmount = ticketType.Price * createBookingDto.Quantity;
            decimal totalAmount = originalAmount;

            // Validate and reserve seats if provided
            string? seatIdsJson = null;
            if (createBookingDto.SeatIds?.Any() == true)
            {
                if (createBookingDto.SeatIds.Count != createBookingDto.Quantity)
                    throw new BadRequestException("Number of seats must match quantity");

                var seatsReserved = await _seatRepository.ReserveSeatsAsync(createBookingDto.SeatIds);
                if (!seatsReserved)
                    throw new BadRequestException("One or more seats are not available");
                
                // Store seat IDs as JSON for later release if booking expires/cancels
                seatIdsJson = JsonSerializer.Serialize(createBookingDto.SeatIds);
            }

            // Validate and apply promo code if provided
            decimal discount = 0;
            int? promoCodeId = null;
            if (!string.IsNullOrEmpty(createBookingDto.PromoCode))
            {
                var promoCode = await _promoCodeRepository.GetByCodeAsync(createBookingDto.PromoCode);
                if (promoCode == null || !await _promoCodeRepository.IsPromoCodeValidAsync(createBookingDto.PromoCode, createBookingDto.EventId))
                    throw new BadRequestException("Invalid or expired promo code");

                promoCodeId = promoCode.Id;

                // Calculate discount on ORIGINAL amount (not already discounted amount)
                if (promoCode.DiscountPercent.HasValue)
                    discount = originalAmount * (promoCode.DiscountPercent.Value / 100);
                else if (promoCode.DiscountAmount.HasValue)
                    discount = promoCode.DiscountAmount.Value;
                
                totalAmount = originalAmount - discount;
            }

            // Update ticket type available quantity (reserve tickets) BEFORE creating booking
            ticketType.AvailableQuantity -= createBookingDto.Quantity;
            _context.TicketTypes.Update(ticketType);
            await _context.SaveChangesAsync();

            // Create booking with all necessary fields for proper tracking
            var booking = new Booking
            {
                UserId = userId,
                EventId = createBookingDto.EventId,
                TicketTypeId = createBookingDto.TicketTypeId,
                Quantity = createBookingDto.Quantity,
                BookingCode = GenerateBookingCode(),
                OriginalAmount = originalAmount,
                TotalAmount = totalAmount,
                DiscountAmount = discount,
                PromoCodeId = promoCodeId,
                SeatIdsJson = seatIdsJson,
                Status = BookingStatus.Pending,
                BookingDate = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15) // 15 minutes to complete payment
            };

            var createdBooking = await _bookingRepository.CreateAsync(booking);

            // Increment promo code usage if applied
            if (promoCodeId.HasValue)
            {
                await _promoCodeRepository.IncrementUsageAsync(promoCodeId.Value);
            }

            // Commit transaction - all operations succeeded
            await transaction.CommitAsync();

            return _mapper.Map<BookingConfirmationDto>(createdBooking);
        }
        catch
        {
            // Rollback transaction on any error - this will:
            // - Restore AvailableQuantity
            // - Release reserved seats (if seats were reserved)
            // - Not create the booking record
            await transaction.RollbackAsync();
            throw; // Re-throw the exception
        }
    }

    public async Task<BookingDto> CancelBookingAsync(int bookingId, CancelBookingDto cancelBookingDto, int userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
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

            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = cancelBookingDto.CancellationReason;
            booking.CancelledAt = DateTime.UtcNow;

            // Restore ticket type available quantity
            var ticketType = await _context.TicketTypes.FindAsync(booking.TicketTypeId);
            if (ticketType != null)
            {
                ticketType.AvailableQuantity += booking.Quantity;
                _context.TicketTypes.Update(ticketType);
                await _context.SaveChangesAsync();
            }

            // Release seats
            // For PENDING bookings: Get seats from SeatIdsJson (tickets don't exist yet)
            // For CONFIRMED bookings: Get seats from tickets (though this shouldn't happen based on status check above)
            List<int>? seatIds = null;
            
            if (!string.IsNullOrEmpty(booking.SeatIdsJson))
            {
                // Pending booking - seats stored in JSON
                seatIds = JsonSerializer.Deserialize<List<int>>(booking.SeatIdsJson);
            }
            else
            {
                // Fallback: try to get from tickets (shouldn't happen for pending bookings)
                var tickets = await _ticketRepository.GetByBookingIdAsync(bookingId);
                seatIds = tickets.Where(t => t.SeatId.HasValue).Select(t => t.SeatId!.Value).ToList();
            }

            if (seatIds?.Any() == true)
            {
                await _seatRepository.ReleaseSeatsAsync(seatIds);
            }

            var updatedBooking = await _bookingRepository.UpdateAsync(booking);
            
            await transaction.CommitAsync();
            
            return _mapper.Map<BookingDto>(updatedBooking);
        }
        catch
        {
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
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                booking.Status = BookingStatus.Cancelled;
                booking.CancellationReason = "Booking expired - payment not completed within time limit";
                booking.CancelledAt = DateTime.UtcNow;

                // Restore ticket type available quantity
                var ticketType = await _context.TicketTypes.FindAsync(booking.TicketTypeId);
                if (ticketType != null)
                {
                    ticketType.AvailableQuantity += booking.Quantity;
                    _context.TicketTypes.Update(ticketType);
                    await _context.SaveChangesAsync();
                }

                // Release seats
                // For expired PENDING bookings: seats are stored in SeatIdsJson (tickets don't exist yet)
                List<int>? seatIds = null;
                
                if (!string.IsNullOrEmpty(booking.SeatIdsJson))
                {
                    seatIds = JsonSerializer.Deserialize<List<int>>(booking.SeatIdsJson);
                }

                if (seatIds?.Any() == true)
                {
                    await _seatRepository.ReleaseSeatsAsync(seatIds);
                }

                await _bookingRepository.UpdateAsync(booking);
                
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                // Log error but continue processing other bookings
                Console.WriteLine($"Error handling expired booking {booking.Id}: {ex.Message}");
            }
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

        // Check minimum purchase against ORIGINAL amount (before any discounts)
        if (promo.MinimumPurchase.HasValue && booking.OriginalAmount < promo.MinimumPurchase.Value)
            throw new BadRequestException($"Minimum purchase of {promo.MinimumPurchase:C} required to use this promo code");

        if (promo.EventId.HasValue && promo.EventId.Value != booking.EventId)
            throw new BadRequestException("Promo code is not valid for this event");

        // Calculate discount on ORIGINAL amount (not already discounted amount)
        decimal discountAmount = 0;
        if (promo.DiscountPercent.HasValue)
        {
            discountAmount = booking.OriginalAmount * (promo.DiscountPercent.Value / 100);
        }
        else if (promo.DiscountAmount.HasValue)
        {
            discountAmount = promo.DiscountAmount.Value;
        }

        // Ensure discount doesn't exceed original amount
        if (discountAmount > booking.OriginalAmount)
            discountAmount = booking.OriginalAmount;

        // Apply discount - update both discount amount and total amount
        booking.PromoCodeId = promo.Id;
        booking.DiscountAmount = discountAmount;
        booking.TotalAmount = booking.OriginalAmount - discountAmount;

        // Increment promo code usage
        await _promoCodeRepository.IncrementUsageAsync(promo.Id);

        // Update booking
        await _bookingRepository.UpdateAsync(booking);

        return _mapper.Map<BookingDto>(booking);
    }

    private string GenerateBookingCode()
    {
        return $"BK{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }
}
