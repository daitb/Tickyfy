using Tickify.DTOs.Ticket;

namespace Tickify.Interfaces.Services;

public interface ITicketService
{
    Task<TicketDto> GetByIdAsync(int id);
    Task<TicketDto> GetByTicketCodeAsync(string ticketCode);
    Task<IEnumerable<TicketDto>> GetByBookingIdAsync(int bookingId);
    Task<IEnumerable<TicketDetailDto>> GetUserTicketsAsync(int userId);
    Task<TicketDto> TransferTicketAsync(int ticketId, TicketTransferDto transferDto, int userId);
    Task<TicketDto> AcceptTransferAsync(AcceptTransferDto acceptTransferDto, int userId);
    Task<bool> RejectTransferAsync(AcceptTransferDto rejectTransferDto, int userId);
    Task<TicketDto> ScanTicketAsync(TicketScanDto scanDto);
    Task<bool> ValidateTicketAsync(string ticketCode, int eventId);
    Task<IEnumerable<TicketDto>> GetTransferableTicketsAsync(int userId, int bookingId);
}
