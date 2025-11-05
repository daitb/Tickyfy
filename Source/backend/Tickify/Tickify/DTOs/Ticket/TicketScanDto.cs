namespace Tickify.DTOs.Ticket;

public class TicketScanDto
{
    public string TicketNumber { get; set; } = string.Empty;
    public string? QrCode { get; set; }
    public int EventId { get; set; }
}
