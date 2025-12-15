using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public class TicketScanRepository : ITicketScanRepository
{
    private readonly ApplicationDbContext _context;

    public TicketScanRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TicketScan?> GetByIdAsync(int id)
    {
        return await _context.TicketScans
            .Include(ts => ts.Ticket)
            .Include(ts => ts.ScannedByUser)
            .FirstOrDefaultAsync(ts => ts.Id == id);
    }

    public async Task<IEnumerable<TicketScan>> GetByTicketIdAsync(int ticketId)
    {
        return await _context.TicketScans
            .Include(ts => ts.ScannedByUser)
            .Where(ts => ts.TicketId == ticketId)
            .OrderByDescending(ts => ts.ScannedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TicketScan>> GetByEventIdAsync(int eventId)
    {
        return await _context.TicketScans
            .Include(ts => ts.Ticket)
                .ThenInclude(t => t.Booking)
            .Where(ts => ts.Ticket.Booking != null && ts.Ticket.Booking.EventId == eventId)
            .OrderByDescending(ts => ts.ScannedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TicketScan>> GetByScannerIdAsync(int scannedByUserId)
    {
        return await _context.TicketScans
            .Include(ts => ts.Ticket)
            .Where(ts => ts.ScannedByUserId == scannedByUserId)
            .OrderByDescending(ts => ts.ScannedAt)
            .ToListAsync();
    }

    public async Task<TicketScan> CreateAsync(TicketScan ticketScan)
    {
        _context.TicketScans.Add(ticketScan);
        await _context.SaveChangesAsync();
        return ticketScan;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var ticketScan = await _context.TicketScans.FindAsync(id);
        if (ticketScan == null) return false;

        _context.TicketScans.Remove(ticketScan);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.TicketScans.AnyAsync(ts => ts.Id == id);
    }

    public async Task<int> GetScanCountByTicketIdAsync(int ticketId)
    {
        return await _context.TicketScans
            .Where(ts => ts.TicketId == ticketId)
            .CountAsync();
    }

    public async Task<TicketScan?> GetLastScanByTicketIdAsync(int ticketId)
    {
        return await _context.TicketScans
            .Where(ts => ts.TicketId == ticketId)
            .OrderByDescending(ts => ts.ScannedAt)
            .FirstOrDefaultAsync();
    }
}
