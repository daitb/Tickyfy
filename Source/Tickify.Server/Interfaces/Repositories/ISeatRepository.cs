using Tickify.Models;

namespace Tickify.Interfaces.Repositories;

public interface ISeatRepository
{
    Task<Seat?> GetByIdAsync(int id);
    Task<IEnumerable<Seat>> GetByEventIdAsync(int eventId);
    Task<IEnumerable<Seat>> GetAvailableSeatsAsync(int eventId);
    Task<Seat> CreateAsync(Seat seat);
    Task<Seat> UpdateAsync(Seat seat);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<IEnumerable<Seat>> CreateBulkAsync(IEnumerable<Seat> seats);
    Task<bool> IsSeatAvailableAsync(int seatId);
    Task<bool> ReserveSeatsAsync(IEnumerable<int> seatIds, int userId);
    Task<bool> ReleaseSeatsAsync(IEnumerable<int> seatIds, int userId);
    Task<bool> AdminReleaseSeatsAsync(IEnumerable<int> seatIds);
    Task<int> ReleaseExpiredReservationsAsync();
    Task<bool> ExtendReservationAsync(IEnumerable<int> seatIds, int userId);
    Task<bool> AdminLockSeatsAsync(IEnumerable<int> seatIds, int adminId, string reason);
    Task<bool> AdminUnlockSeatsAsync(IEnumerable<int> seatIds);
    Task<bool> MarkSeatsAsSoldAsync(IEnumerable<int> seatIds);
}
