using Tickify.Models;

namespace Tickify.Interfaces.Repositories;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(int id);
    Task<Booking?> GetByBookingCodeAsync(string bookingCode);
    Task<IEnumerable<Booking>> GetByUserIdAsync(int userId);
    Task<IEnumerable<Booking>> GetByEventIdAsync(int eventId);
    Task<Booking> CreateAsync(Booking booking);
    Task<Booking> UpdateAsync(Booking booking);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<int> CountByUserIdAsync(int userId);
    Task<IEnumerable<Booking>> GetExpiredBookingsAsync();
}
