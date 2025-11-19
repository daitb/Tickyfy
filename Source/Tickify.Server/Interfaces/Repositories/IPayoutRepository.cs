using Tickify.Models;

namespace Tickify.Interfaces.Repositories;

public interface IPayoutRepository
{
    Task<Payout?> GetByIdAsync(int id);
    Task<IEnumerable<Payout>> GetAllAsync();
    Task<IEnumerable<Payout>> GetByOrganizerIdAsync(int organizerId);
    Task<Payout> CreateAsync(Payout payout);
    Task<Payout> UpdateAsync(Payout payout);
    Task<bool> ExistsAsync(int id);
}

