using Tickify.Models;

namespace Tickify.Interfaces.Repositories;

public interface ITicketRepository
{
    Task<Ticket?> GetByIdAsync(int id);
    Task<Ticket?> GetByTicketCodeAsync(string ticketCode);
    Task<IEnumerable<Ticket>> GetByBookingIdAsync(int bookingId);
    Task<IEnumerable<Ticket>> GetByUserIdAsync(int userId);
    Task<Ticket> CreateAsync(Ticket ticket);
    Task<Ticket> UpdateAsync(Ticket ticket);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<IEnumerable<Ticket>> CreateBulkAsync(IEnumerable<Ticket> tickets);
    Task<bool> IsTicketValidAsync(string ticketCode, int eventId);
}
