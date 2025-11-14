namespace Tickify.DTOs.Seat;

public class SeatDto
{
    public int SeatId { get; set; }
    public int EventId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public int RowNumber { get; set; }
    public bool IsAvailable { get; set; }
    public decimal Price { get; set; }
}
