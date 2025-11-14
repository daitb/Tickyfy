namespace Tickify.DTOs.Booking;

public class BookingDto
{
    public int BookingId { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
}
