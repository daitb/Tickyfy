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
        try
        {
            var seats = await _context.Seats
                .Include(s => s.TicketType)
                    .ThenInclude(tt => tt.Event)
                .Include(s => s.SeatZone)
                .Include(s => s.Tickets)
                .Where(s => s.TicketType.EventId == eventId)
                .OrderBy(s => s.Row)
                .ThenBy(s => s.SeatNumber)
                .ToListAsync();
            
            Console.WriteLine($"[SeatRepository] GetByEventIdAsync: Event {eventId}, Found {seats.Count} seats");
            
            // Validate seats have required data
            var invalidSeats = seats.Where(s => s.TicketType == null || s.TicketType.EventId != eventId).ToList();
            if (invalidSeats.Any())
            {
                Console.WriteLine($"[SeatRepository] WARNING: Found {invalidSeats.Count} seats with invalid TicketType for event {eventId}");
            }
            
            return seats;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SeatRepository] GetByEventIdAsync error for event {eventId}: {ex.Message}");
            Console.WriteLine($"[SeatRepository] Stack trace: {ex.StackTrace}");
            throw;
        }
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
        return seat != null && 
               seat.Status == SeatStatus.Available && 
               !seat.IsBlocked;
    }

    public async Task<bool> ReserveSeatsAsync(IEnumerable<int> seatIds, int userId)
    {
        var seatIdsList = seatIds.ToList();
        
        Console.WriteLine($"[SeatRepository] ReserveSeats: User {userId} requesting {seatIdsList.Count} seats: {string.Join(", ", seatIdsList)}");
        
        // First, check if all seats exist
        var allSeats = await _context.Seats
            .Include(s => s.TicketType)
            .Where(s => seatIdsList.Contains(s.Id))
            .ToListAsync();
        
        var foundSeatIds = allSeats.Select(s => s.Id).ToList();
        var missingSeatIds = seatIdsList.Except(foundSeatIds).ToList();
        
        if (missingSeatIds.Any())
        {
            Console.WriteLine($"[SeatRepository] ReserveSeats: ❌ Seats not found in database: {string.Join(", ", missingSeatIds)}");
            Console.WriteLine($"[SeatRepository] ReserveSeats: Found seats: {string.Join(", ", foundSeatIds)}");
            return false;
        }
        
        // Check for blocked seats
        var blockedSeats = allSeats.Where(s => s.IsBlocked).Select(s => s.Id).ToList();
        if (blockedSeats.Any())
        {
            Console.WriteLine($"[SeatRepository] ReserveSeats: ❌ Blocked seats: {string.Join(", ", blockedSeats)}");
            return false;
        }
        
        // Check for seats that are not available (sold or reserved by another user)
        var unavailableSeats = allSeats
            .Where(s => s.Status != SeatStatus.Available && 
                       !(s.Status == SeatStatus.Reserved && s.ReservedByUserId == userId))
            .Select(s => new { s.Id, s.Status, s.ReservedByUserId })
            .ToList();
        
        if (unavailableSeats.Any())
        {
            Console.WriteLine($"[SeatRepository] ReserveSeats: ❌ Unavailable seats:");
            foreach (var seat in unavailableSeats)
            {
                Console.WriteLine($"[SeatRepository]   - Seat {seat.Id}: Status={seat.Status}, ReservedBy={seat.ReservedByUserId}");
            }
            return false;
        }
        
        // All checks passed, get the seats that can be reserved
        var seats = allSeats
            .Where(s => s.Status == SeatStatus.Available || 
                       (s.Status == SeatStatus.Reserved && s.ReservedByUserId == userId))
            .ToList();

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
        
        Console.WriteLine($"[SeatRepository] ReserveSeats: ✅ Successfully reserved {seats.Count} seats for user {userId}");

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
