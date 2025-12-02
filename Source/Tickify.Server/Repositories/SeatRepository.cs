using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Hubs;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public class SeatRepository : ISeatRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<SeatHub> _seatHubContext;

    public SeatRepository(ApplicationDbContext context, IHubContext<SeatHub> seatHubContext)
    {
        _context = context;
        _seatHubContext = seatHubContext;
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
            .Include(s => s.SeatZone)
            .Include(s => s.Tickets)
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

    public async Task<bool> ReserveSeatsAsync(IEnumerable<int> seatIds, int userId)
    {
        var seats = await _context.Seats
            .Include(s => s.TicketType)
            .Where(s => seatIds.Contains(s.Id) && 
                   (s.Status == SeatStatus.Available || 
                    (s.Status == SeatStatus.Reserved && s.ReservedByUserId == userId)))
            .ToListAsync();

        if (seats.Count != seatIds.Count())
            return false;

        var eventId = seats.FirstOrDefault()?.TicketType.EventId;
        if (!eventId.HasValue)
            return false;

        foreach (var seat in seats)
        {
            seat.Status = SeatStatus.Reserved;
            seat.ReservedByUserId = userId;
            seat.ReservedUntil = DateTime.UtcNow.AddMinutes(15);
            seat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Broadcast to all clients viewing this event
        await _seatHubContext.Clients
            .Group($"Event_{eventId}")
            .SendAsync("SeatsUpdated", new
            {
                eventId = eventId.Value,
                seatIds = seatIds,
                status = "Reserved",
                reservedByUserId = userId
            });

        return true;
    }

    public async Task<bool> ReleaseSeatsAsync(IEnumerable<int> seatIds, int userId)
    {
        var seats = await _context.Seats
            .Include(s => s.TicketType)
            .Where(s => seatIds.Contains(s.Id) && 
                       (s.Status == SeatStatus.Reserved && s.ReservedByUserId == userId))
            .ToListAsync();

        if (!seats.Any())
            return true;

        var eventId = seats.FirstOrDefault()?.TicketType.EventId;

        foreach (var seat in seats)
        {
            seat.Status = SeatStatus.Available;
            seat.ReservedByUserId = null;
            seat.ReservedUntil = null;
            seat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Broadcast release to all clients
        if (eventId.HasValue)
        {
            await _seatHubContext.Clients
                .Group($"Event_{eventId}")
                .SendAsync("SeatsUpdated", new
                {
                    eventId = eventId.Value,
                    seatIds = seatIds,
                    status = "Available"
                });
        }

        return true;
    }

    public async Task<bool> AdminReleaseSeatsAsync(IEnumerable<int> seatIds)
    {
        var seats = await _context.Seats
            .Include(s => s.TicketType)
            .Where(s => seatIds.Contains(s.Id))
            .ToListAsync();

        if (!seats.Any())
            return true;

        var eventId = seats.FirstOrDefault()?.TicketType.EventId;

        foreach (var seat in seats)
        {
            seat.Status = SeatStatus.Available;
            seat.ReservedByUserId = null;
            seat.ReservedUntil = null;
            seat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Broadcast release to all clients
        if (eventId.HasValue)
        {
            await _seatHubContext.Clients
                .Group($"Event_{eventId}")
                .SendAsync("SeatsUpdated", new
                {
                    eventId = eventId.Value,
                    seatIds = seatIds,
                    status = "Available"
                });
        }

        return true;
    }

    public async Task<int> ReleaseExpiredReservationsAsync()
    {
        var expiredSeats = await _context.Seats
            .Include(s => s.TicketType)
            .Where(s => s.Status == SeatStatus.Reserved && 
                   s.ReservedUntil.HasValue && 
                   s.ReservedUntil.Value < DateTime.UtcNow)
            .ToListAsync();

        if (!expiredSeats.Any())
            return 0;

        // Group by event for broadcasting
        var seatsByEvent = expiredSeats.GroupBy(s => s.TicketType.EventId);

        foreach (var seat in expiredSeats)
        {
            seat.Status = SeatStatus.Available;
            seat.ReservedByUserId = null;
            seat.ReservedUntil = null;
            seat.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Broadcast for each event
        foreach (var eventGroup in seatsByEvent)
        {
            var seatIds = eventGroup.Select(s => s.Id);
            await _seatHubContext.Clients
                .Group($"Event_{eventGroup.Key}")
                .SendAsync("SeatsUpdated", new
                {
                    eventId = eventGroup.Key,
                    seatIds = seatIds,
                    status = "Available",
                    reason = "ReservationExpired"
                });
        }

        return expiredSeats.Count;
    }
}
