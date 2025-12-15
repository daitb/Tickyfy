using Tickify.Models;

namespace Tickify.Interfaces.Repositories;
public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(int id);
    Task<IEnumerable<Review>> GetByEventIdAsync(int eventId);
    Task<IEnumerable<Review>> GetByUserIdAsync(int userId);
    Task<Review> CreateAsync(Review review);
    Task<Review> UpdateAsync(Review review);
    Task<bool> DeleteAsync(int id, int ownerUserId, bool isAdmin);
    Task<bool> ExistsAsync(int id);
}
