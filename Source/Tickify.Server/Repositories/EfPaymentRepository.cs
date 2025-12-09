using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;
public sealed class EfPaymentRepository : IPaymentRepository
{
    private readonly ApplicationDbContext _db;
    public EfPaymentRepository(ApplicationDbContext db) => _db = db;

    public Task<Payment?> GetAsync(int id, CancellationToken ct) =>
        _db.Payments.FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<List<Payment>> ListByBookingAsync(int bookingId, CancellationToken ct) =>
        _db.Payments.Where(x => x.BookingId == bookingId).OrderByDescending(x => x.Id).ToListAsync(ct);

    public async Task<int> AddAsync(Payment p, CancellationToken ct)
    {
        _db.Payments.Add(p);
        await _db.SaveChangesAsync(ct);
        return p.Id; // identity
    }

    public async Task UpdateAsync(Payment p, CancellationToken ct)
    {
        _db.Payments.Update(p);
        await _db.SaveChangesAsync(ct);
    }

    public Task<bool> ExistsAsync(int id, PaymentStatus status, CancellationToken ct) =>
        _db.Payments.AnyAsync(x => x.Id == id && x.Status == status, ct);
}
