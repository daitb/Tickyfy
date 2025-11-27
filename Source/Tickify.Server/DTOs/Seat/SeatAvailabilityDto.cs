namespace Tickify.DTOs.Seat;

public class SeatAvailabilityDto
{
    public int TicketTypeId { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TotalSeats { get; set; }
    public int AvailableSeats { get; set; }
    public int ReservedSeats { get; set; }
    public int SoldSeats { get; set; }
    public List<SeatDto> Seats { get; set; } = new();
}

