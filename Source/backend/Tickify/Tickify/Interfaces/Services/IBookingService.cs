using Tickify.DTOs.Booking;

namespace Tickify.Interfaces.Services;

public interface IBookingService
{
    Task<BookingDto> GetByIdAsync(int id);
    Task<BookingDto> GetByBookingCodeAsync(string bookingCode);
    Task<IEnumerable<BookingListDto>> GetByUserIdAsync(int userId);
    Task<IEnumerable<BookingListDto>> GetByEventIdAsync(int eventId);
    Task<BookingConfirmationDto> CreateBookingAsync(CreateBookingDto createBookingDto, int userId);
    Task<BookingDto> CancelBookingAsync(int bookingId, CancelBookingDto cancelBookingDto, int userId);
    Task<BookingDetailDto> GetBookingDetailsAsync(int bookingId, int userId);
    Task<IEnumerable<BookingListDto>> GetUserBookingHistoryAsync(int userId);
    Task<BookingDto> UpdateBookingStatusAsync(int bookingId, string status);
    Task HandleExpiredBookingsAsync();
    Task<BookingDto> ApplyPromoCodeAsync(int bookingId, string promoCode, int userId);
}
