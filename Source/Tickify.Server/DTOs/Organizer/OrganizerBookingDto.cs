namespace Tickify.DTOs.Organizer;

public class OrganizerBookingDto
{
    public int BookingId { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public string Status { get; set; } = string.Empty;
    
    // Event info
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    
    // Customer info
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    
    // Booking details
    public int TotalTickets { get; set; }
    public decimal TotalAmount { get; set; }
    
    // Payment info
    public string? PaymentStatus { get; set; }
    public DateTime? PaymentDate { get; set; }
}
