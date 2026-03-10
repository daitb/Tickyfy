using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly ApplicationDbContext _context;

    public TicketRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Ticket?> GetByIdAsync(int id)
    {
        return await _context.Tickets
            .Include(t => t.Booking)
            .Include(t => t.TicketType)
            .Include(t => t.Seat)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Ticket?> GetByTicketCodeAsync(string ticketCode)
    {
        return await _context.Tickets
            .Include(t => t.Booking)
                .ThenInclude(b => b!.Event)
            .Include(t => t.TicketType)
            .FirstOrDefaultAsync(t => t.TicketCode == ticketCode);
    }

    public async Task<IEnumerable<Ticket>> GetByBookingIdAsync(int bookingId)
    {
        return await _context.Tickets
            .Include(t => t.TicketType)
            .Include(t => t.Seat)
            .Where(t => t.BookingId == bookingId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Ticket>> GetByUserIdAsync(int userId)
    {
        // Only get tickets where:
        // 1. Ticket has a booking
        // 2. Booking belongs to the user
        // 3. Ticket still belongs to that booking (not transferred to another booking)
        return await _context.Tickets
            .Include(t => t.Booking)
                .ThenInclude(b => b!.Event)
            .Include(t => t.TicketType)
            .Include(t => t.Seat) // Include seat information for seat-based tickets
            .Where(t => t.Booking != null && t.Booking.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<Ticket> CreateAsync(Ticket ticket)
    {
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    public async Task<Ticket> UpdateAsync(Ticket ticket)
    {
        _context.Tickets.Update(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return false;

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Tickets.AnyAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<Ticket>> CreateBulkAsync(IEnumerable<Ticket> tickets)
    {
        await _context.Tickets.AddRangeAsync(tickets);
        await _context.SaveChangesAsync();
        return tickets;
    }

    public async Task<bool> IsTicketValidAsync(string ticketCode, int eventId)
    {
        return await _context.Tickets
            .Include(t => t.Booking)
            .AnyAsync(t => t.TicketCode == ticketCode 
                && t.Booking != null
                && t.Booking.EventId == eventId 
                && t.Status == TicketStatus.Valid);
    }

    public async Task<int> CountByUserIdAsync(int userId)
    {
        return await _context.Tickets
            .Include(t => t.Booking)
            .Where(t => t.Booking != null && t.Booking.UserId == userId)
            .CountAsync();
    }
}
