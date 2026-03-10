namespace Tickify.DTOs.Booking;

public class BookingConfirmationDto
{
    public int BookingId { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public string EventTitle { get; set; } = string.Empty;
    public DateTime EventStartDate { get; set; }
    public string EventVenue { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public List<string> TicketNumbers { get; set; } = new();
    public string PaymentStatus { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
