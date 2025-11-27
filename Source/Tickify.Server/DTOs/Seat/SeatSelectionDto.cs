namespace Tickify.DTOs.Seat;

public class SeatSelectionDto
{
    public int SeatId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public int TicketTypeId { get; set; }
}
