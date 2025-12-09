using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;
public sealed class EfRefundRequestRepository : IRefundRequestRepository
{
    private readonly ApplicationDbContext _db;
    public EfRefundRequestRepository(ApplicationDbContext db) => _db = db;

    public Task<RefundRequest?> GetByIdAsync(int id) =>
        _db.RefundRequests.Include(x => x.Booking).FirstOrDefaultAsync(x => x.Id == id);

    public async Task<IEnumerable<RefundRequest>> GetAllAsync() =>
        await _db.RefundRequests.OrderByDescending(x => x.CreatedAt).ToListAsync();

    public async Task<IEnumerable<RefundRequest>> GetByUserIdAsync(int userId) =>
        await _db.RefundRequests.Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync();

    public async Task<RefundRequest> CreateAsync(RefundRequest req)
    {
        _db.RefundRequests.Add(req);
        await _db.SaveChangesAsync();
        return req;
    }

    public async Task<RefundRequest> UpdateAsync(RefundRequest req)
    {
        _db.RefundRequests.Update(req);
        await _db.SaveChangesAsync();
        return req;
    }

    public Task<bool> ExistsAsync(int id) =>
        _db.RefundRequests.AnyAsync(x => x.Id == id);
}
