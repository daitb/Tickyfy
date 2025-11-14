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
        _context.TicketTransfers.Update(ticketTransfer);
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
