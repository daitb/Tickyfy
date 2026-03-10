using Tickify.Models;

namespace Tickify.Interfaces.Repositories;

public interface ITicketScanRepository
{
    Task<TicketScan?> GetByIdAsync(int id);
    Task<IEnumerable<TicketScan>> GetByTicketIdAsync(int ticketId);
    Task<IEnumerable<TicketScan>> GetByEventIdAsync(int eventId);
    Task<IEnumerable<TicketScan>> GetByScannerIdAsync(int scannedByUserId);
    Task<TicketScan> CreateAsync(TicketScan ticketScan);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<int> GetScanCountByTicketIdAsync(int ticketId);
    Task<TicketScan?> GetLastScanByTicketIdAsync(int ticketId);
}
