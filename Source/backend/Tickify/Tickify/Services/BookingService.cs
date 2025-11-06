using AutoMapper;
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
    private readonly IMapper _mapper;

    public BookingService(
        IBookingRepository bookingRepository,
        ITicketRepository ticketRepository,
        ISeatRepository seatRepository,
        IPromoCodeRepository promoCodeRepository,
        IMapper mapper)
    {
        _bookingRepository = bookingRepository;
        _ticketRepository = ticketRepository;
        _seatRepository = seatRepository;
        _promoCodeRepository = promoCodeRepository;
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
        // Calculate total amount based on ticket type and quantity (should be calculated, not from DTO)
        // For now, we'll need to get ticket type price
        decimal totalAmount = 0; // TODO: Get from TicketType price * quantity

        // Validate seat availability
        if (createBookingDto.SeatIds?.Any() == true)
        {
            if (createBookingDto.SeatIds.Count != createBookingDto.Quantity)
                throw new BadRequestException("Number of seats must match quantity");

            var seatsReserved = await _seatRepository.ReserveSeatsAsync(createBookingDto.SeatIds);
            if (!seatsReserved)
                throw new BadRequestException("One or more seats are not available");
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

            // Calculate discount
            if (promoCode.DiscountPercent.HasValue)
                discount = totalAmount * (promoCode.DiscountPercent.Value / 100);
            else if (promoCode.DiscountAmount.HasValue)
                discount = promoCode.DiscountAmount.Value;
        }

        // Create booking
        var booking = new Booking
        {
            UserId = userId,
            EventId = createBookingDto.EventId,
            BookingCode = GenerateBookingCode(),
            TotalAmount = totalAmount - discount,
            DiscountAmount = discount,
            PromoCodeId = promoCodeId,
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

        return _mapper.Map<BookingConfirmationDto>(createdBooking);
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

        booking.Status = BookingStatus.Cancelled;
        booking.CancellationReason = cancelBookingDto.CancellationReason;
        booking.CancelledAt = DateTime.UtcNow;

        // Release seats
        var tickets = await _ticketRepository.GetByBookingIdAsync(bookingId);
        var seatIds = tickets.Where(t => t.SeatId.HasValue).Select(t => t.SeatId!.Value);
        if (seatIds.Any())
        {
            await _seatRepository.ReleaseSeatsAsync(seatIds);
        }

        var updatedBooking = await _bookingRepository.UpdateAsync(booking);
        return _mapper.Map<BookingDto>(updatedBooking);
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
                await _seatRepository.ReleaseSeatsAsync(seatIds);
            }

            await _bookingRepository.UpdateAsync(booking);
        }
    }

    private string GenerateBookingCode()
    {
        return $"BK{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }
}
