using Tickify.Models;

namespace Tickify.Interfaces.Repositories
{
    public interface IPaymentRepository
    {
        Task<IEnumerable<Payment>> GetAllAsync();
        Task<Payment?> GetByIdAsync(int id);
        Task<Payment?> GetByBookingIdAsync(int bookingId);
        Task<Payment> AddAsync(Payment entity);
        Task UpdateAsync(Payment entity);
        Task DeleteAsync(int id);
    }
}
