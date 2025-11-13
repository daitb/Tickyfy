using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public class SeatRepository : ISeatRepository
{
    private readonly ApplicationDbContext _context;

    public SeatRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Seat?> GetByIdAsync(int id)
    {
        return await _context.Seats
            .Include(s => s.TicketType)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<Seat>> GetByEventIdAsync(int eventId)
    {
        return await _context.Seats
            .Include(s => s.TicketType)
            .Where(s => s.TicketType.EventId == eventId)
            .OrderBy(s => s.Row)
            .ThenBy(s => s.SeatNumber)
            .ToListAsync();
    }

    public async Task<IEnumerable<Seat>> GetAvailableSeatsAsync(int eventId)
    {
        return await _context.Seats
            .Include(s => s.TicketType)
            .Where(s => s.TicketType.EventId == eventId && s.Status == SeatStatus.Available)
            .OrderBy(s => s.Row)
            .ThenBy(s => s.SeatNumber)
            .ToListAsync();
    }

    public async Task<Seat> CreateAsync(Seat seat)
    {
        _context.Seats.Add(seat);
        await _context.SaveChangesAsync();
        return seat;
    }

    public async Task<Seat> UpdateAsync(Seat seat)
    {
        _context.Seats.Update(seat);
        await _context.SaveChangesAsync();
        return seat;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var seat = await _context.Seats.FindAsync(id);
        if (seat == null) return false;

        _context.Seats.Remove(seat);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Seats.AnyAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<Seat>> CreateBulkAsync(IEnumerable<Seat> seats)
    {
        await _context.Seats.AddRangeAsync(seats);
        await _context.SaveChangesAsync();
        return seats;
    }

    public async Task<bool> IsSeatAvailableAsync(int seatId)
    {
        var seat = await _context.Seats.FindAsync(seatId);
        return seat?.Status == SeatStatus.Available;
    }

    public async Task<bool> ReserveSeatsAsync(IEnumerable<int> seatIds)
    {
        var seats = await _context.Seats
            .Where(s => seatIds.Contains(s.Id) && s.Status == SeatStatus.Available)
            .ToListAsync();

        if (seats.Count != seatIds.Count())
            return false;

        foreach (var seat in seats)
        {
            seat.Status = SeatStatus.Reserved;
            seat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReleaseSeatsAsync(IEnumerable<int> seatIds)
    {
        var seats = await _context.Seats
            .Where(s => seatIds.Contains(s.Id))
            .ToListAsync();

        foreach (var seat in seats)
        {
            seat.Status = SeatStatus.Available;
            seat.ReservedByUserId = null;
            seat.ReservedUntil = null;
            seat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
