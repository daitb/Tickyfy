using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public class TicketTransferRepository : ITicketTransferRepository
{
    private readonly ApplicationDbContext _context;

    public TicketTransferRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TicketTransfer?> GetByIdAsync(int id)
    {
        return await _context.TicketTransfers
            .Include(tt => tt.Ticket)
            .Include(tt => tt.FromUser)
            .Include(tt => tt.ToUser)
            .FirstOrDefaultAsync(tt => tt.Id == id);
    }

    public async Task<IEnumerable<TicketTransfer>> GetByTicketIdAsync(int ticketId)
    {
        return await _context.TicketTransfers
            .Include(tt => tt.FromUser)
            .Include(tt => tt.ToUser)
            .Where(tt => tt.TicketId == ticketId)
            .OrderByDescending(tt => tt.TransferredAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TicketTransfer>> GetByFromUserIdAsync(int fromUserId)
    {
        return await _context.TicketTransfers
            .Include(tt => tt.Ticket)
            .Include(tt => tt.ToUser)
            .Where(tt => tt.FromUserId == fromUserId)
            .OrderByDescending(tt => tt.TransferredAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TicketTransfer>> GetByToUserIdAsync(int toUserId)
    {
        return await _context.TicketTransfers
            .Include(tt => tt.Ticket)
            .Include(tt => tt.FromUser)
            .Where(tt => tt.ToUserId == toUserId)
            .OrderByDescending(tt => tt.TransferredAt)
            .ToListAsync();
    }

    public async Task<TicketTransfer> CreateAsync(TicketTransfer ticketTransfer)
    {
        _context.TicketTransfers.Add(ticketTransfer);
        await _context.SaveChangesAsync();
        return ticketTransfer;
    }

    public async Task<TicketTransfer> UpdateAsync(TicketTransfer ticketTransfer)
    {
        // Check if entity is already being tracked
        var entry = _context.Entry(ticketTransfer);
        
        if (entry.State == Microsoft.EntityFrameworkCore.EntityState.Detached)
        {
            // Entity is not tracked, try to find it first
            var existing = await _context.TicketTransfers.FindAsync(ticketTransfer.Id);
            if (existing != null)
            {
                // Update existing tracked entity
                _context.Entry(existing).CurrentValues.SetValues(ticketTransfer);
                await _context.SaveChangesAsync();
                return existing;
            }
            else
            {
                // New entity, attach and mark as modified
                _context.TicketTransfers.Update(ticketTransfer);
            }
        }
        // If entity is already tracked, EF will automatically detect changes
        // Just ensure it's marked as modified if needed
        else if (entry.State == Microsoft.EntityFrameworkCore.EntityState.Unchanged)
        {
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Modified;
        }
        
        await _context.SaveChangesAsync();
        return ticketTransfer;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var ticketTransfer = await _context.TicketTransfers.FindAsync(id);
        if (ticketTransfer == null) return false;

        _context.TicketTransfers.Remove(ticketTransfer);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.TicketTransfers.AnyAsync(tt => tt.Id == id);
    }

    public async Task<IEnumerable<TicketTransfer>> GetPendingTransfersAsync(int userId)
    {
        return await _context.TicketTransfers
            .Include(tt => tt.Ticket)
            .Include(tt => tt.FromUser)
            .Where(tt => tt.ToUserId == userId && !tt.IsApproved)
            .OrderByDescending(tt => tt.TransferredAt)
            .ToListAsync();
    }
}
