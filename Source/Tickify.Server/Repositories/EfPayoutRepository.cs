using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public sealed class EfPayoutRepository : IPayoutRepository
{
    private readonly ApplicationDbContext _db;
    
    public EfPayoutRepository(ApplicationDbContext db) => _db = db;

    public Task<Payout?> GetByIdAsync(int id) =>
        _db.Payouts
            .Include(p => p.Organizer)
                .ThenInclude(o => o!.User)
            .Include(p => p.ProcessedByStaff)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<IEnumerable<Payout>> GetAllAsync() =>
        await _db.Payouts
            .Include(p => p.Organizer)
                .ThenInclude(o => o!.User)
            .Include(p => p.ProcessedByStaff)
            .OrderByDescending(p => p.RequestedAt)
            .ToListAsync();

    public async Task<IEnumerable<Payout>> GetByOrganizerIdAsync(int organizerId) =>
        await _db.Payouts
            .Where(p => p.OrganizerId == organizerId)
            .Include(p => p.Organizer)
                .ThenInclude(o => o!.User)
            .Include(p => p.ProcessedByStaff)
            .OrderByDescending(p => p.RequestedAt)
            .ToListAsync();

    public async Task<Payout> CreateAsync(Payout payout)
    {
        _db.Payouts.Add(payout);
        await _db.SaveChangesAsync();
        return payout;
    }

    public async Task<Payout> UpdateAsync(Payout payout)
    {
        _db.Payouts.Update(payout);
        await _db.SaveChangesAsync();
        return payout;
    }

    public Task<bool> ExistsAsync(int id) =>
        _db.Payouts.AnyAsync(p => p.Id == id);
}

