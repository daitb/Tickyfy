using Tickify.Models;

namespace Tickify.Interfaces.Repositories;

public interface ITicketTransferRepository
{
    Task<TicketTransfer?> GetByIdAsync(int id);
    Task<IEnumerable<TicketTransfer>> GetByTicketIdAsync(int ticketId);
    Task<IEnumerable<TicketTransfer>> GetByFromUserIdAsync(int fromUserId);
    Task<IEnumerable<TicketTransfer>> GetByToUserIdAsync(int toUserId);
    Task<TicketTransfer> CreateAsync(TicketTransfer ticketTransfer);
    Task<TicketTransfer> UpdateAsync(TicketTransfer ticketTransfer);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<IEnumerable<TicketTransfer>> GetPendingTransfersAsync(int userId);
}
