namespace Tickify.DTOs.Seat;

public class CreateSeatDto
{
    public int EventId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public int RowNumber { get; set; }
    public decimal Price { get; set; }
}
