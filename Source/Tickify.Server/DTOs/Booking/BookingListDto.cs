namespace Tickify.DTOs.Booking;

public class BookingListDto
{
    public int BookingId { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public string EventTitle { get; set; } = string.Empty;
    public string? EventImageUrl { get; set; }
    public DateTime EventStartDate { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
}
