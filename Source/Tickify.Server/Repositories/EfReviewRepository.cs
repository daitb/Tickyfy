using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;
public sealed class EfReviewRepository : IReviewRepository
{
    private readonly ApplicationDbContext _db;
    public EfReviewRepository(ApplicationDbContext db) => _db = db;

    public Task<Review?> GetByIdAsync(int id)
        => _db.Reviews
            .Include(r => r.User)
            .Include(r => r.Event)
            .FirstOrDefaultAsync(r => r.Id == id);

    public async Task<IEnumerable<Review>> GetByEventIdAsync(int eventId)
        => await _db.Reviews
            .Where(r => r.EventId == eventId)
            .Include(r => r.User)
            .Include(r => r.Event)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<Review>> GetByUserIdAsync(int userId)
        => await _db.Reviews
            .Where(r => r.UserId == userId)
            .Include(r => r.User)
            .Include(r => r.Event)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

    public async Task<Review> CreateAsync(Review r)
    {
        _db.Reviews.Add(r);
        await _db.SaveChangesAsync();
        
        // Reload with User and Event to populate navigation properties
        await _db.Entry(r).Reference(x => x.User).LoadAsync();
        await _db.Entry(r).Reference(x => x.Event).LoadAsync();
        
        return r;
    }

    public async Task<Review> UpdateAsync(Review r)
    {
        _db.Reviews.Update(r);
        await _db.SaveChangesAsync();
        return r;
    }

    public async Task<bool> DeleteAsync(int id, int ownerUserId, bool isAdmin)
    {
        var r = await _db.Reviews.FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return false;
        if (!isAdmin && r.UserId != ownerUserId) return false;
        _db.Reviews.Remove(r);
        await _db.SaveChangesAsync();
        return true;
    }

    public Task<bool> ExistsAsync(int id) => _db.Reviews.AnyAsync(r => r.Id == id);
}
