namespace Tickify.DTOs.Booking;

public class CancelBookingDto
{
    public int BookingId { get; set; }
    public string? CancellationReason { get; set; }
}
