namespace Tickify.DTOs.Ticket;

public class TicketTransferDto
{
    public int TicketId { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string? Message { get; set; }
}
