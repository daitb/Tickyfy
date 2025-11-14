namespace Tickify.DTOs.Ticket;

public class TicketDetailDto
{
    public int TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    
    public int BookingId { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public string EventVenue { get; set; } = string.Empty;
    public DateTime EventStartDate { get; set; }
    public DateTime EventEndDate { get; set; }
    
    public string TicketTypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    
    public int? SeatId { get; set; }
    public string? SeatNumber { get; set; }
    
    public string Status { get; set; } = string.Empty;
    public string? QrCode { get; set; }
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
