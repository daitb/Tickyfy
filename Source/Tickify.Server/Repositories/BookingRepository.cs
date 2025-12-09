using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly ApplicationDbContext _context;

    public BookingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Booking?> GetByIdAsync(int id)
    {
        return await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Event)
            .Include(b => b.Tickets)
            .Include(b => b.PromoCode)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Booking?> GetByBookingCodeAsync(string bookingCode)
    {
        return await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Event)
            .Include(b => b.Tickets)
            .FirstOrDefaultAsync(b => b.BookingCode == bookingCode);
    }

    public async Task<IEnumerable<Booking>> GetByUserIdAsync(int userId)
    {
        return await _context.Bookings
            .Include(b => b.Event)
            .Include(b => b.Tickets)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Booking>> GetByEventIdAsync(int eventId)
    {
        return await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Tickets)
            .Where(b => b.EventId == eventId)
            .OrderByDescending(b => b.BookingDate)
            .ToListAsync();
    }

    public async Task<Booking> CreateAsync(Booking booking)
    {
        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();
        return booking;
    }

    public async Task<Booking> UpdateAsync(Booking booking)
    {
        _context.Bookings.Update(booking);
        await _context.SaveChangesAsync();
        return booking;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null) return false;

        _context.Bookings.Remove(booking);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Bookings.AnyAsync(b => b.Id == id);
    }

    public async Task<int> CountByUserIdAsync(int userId)
    {
        return await _context.Bookings
            .Where(b => b.UserId == userId)
            .CountAsync();
    }

    public async Task<IEnumerable<Booking>> GetExpiredBookingsAsync()
    {
        var now = DateTime.UtcNow;
        return await _context.Bookings
            .Where(b => b.Status == BookingStatus.Pending && b.ExpiresAt < now)
            .ToListAsync();
    }
}
