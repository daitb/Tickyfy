namespace Tickify.DTOs.Waitlist;

public class JoinWaitlistDto
{
    public int EventId { get; set; }
    public int? TicketTypeId { get; set; } // Optional: specific ticket type
    public int RequestedQuantity { get; set; } = 1;
    public string? Notes { get; set; }
}
