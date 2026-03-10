namespace Tickify.DTOs.Ticket;

public class TicketTransferDto
{
    public string RecipientEmail { get; set; } = string.Empty;
    public string? Message { get; set; }
}
