using Tickify.Models;

namespace Tickify.Interfaces.Repositories;
public interface IRefundRequestRepository
{
    Task<RefundRequest?> GetByIdAsync(int id);
    Task<IEnumerable<RefundRequest>> GetAllAsync();
    Task<IEnumerable<RefundRequest>> GetByUserIdAsync(int userId);
    Task<RefundRequest> CreateAsync(RefundRequest req);
    Task<RefundRequest> UpdateAsync(RefundRequest req);
    Task<bool> ExistsAsync(int id);
}
