using Tickify.Models;

namespace Tickify.Interfaces.Repositories
{
    public interface IPaymentRepository
    {
        Task<Payment?> GetAsync(int id, CancellationToken ct);
        Task<List<Payment>> ListByBookingAsync(int bookingId, CancellationToken ct);
        Task<int> AddAsync(Payment payment, CancellationToken ct);         // trả về Id (identity)
        Task UpdateAsync(Payment payment, CancellationToken ct);
        Task<bool> ExistsAsync(int id, PaymentStatus status, CancellationToken ct);
    }
}
