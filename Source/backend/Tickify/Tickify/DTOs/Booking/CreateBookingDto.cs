namespace Tickify.DTOs.Booking;

public class CreateBookingDto
{
    public int EventId { get; set; }
    public int TicketTypeId { get; set; }
    public int Quantity { get; set; }
    public string? PromoCode { get; set; }
    public List<int>? SeatIds { get; set; }
}
