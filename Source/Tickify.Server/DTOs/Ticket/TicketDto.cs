namespace Tickify.DTOs.Ticket;

public class TicketDto
{
    public int TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public int BookingId { get; set; }
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public string TicketTypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? SeatNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? QrCode { get; set; }
    public DateTime CreatedAt { get; set; }
}
