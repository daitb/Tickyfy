namespace Tickify.DTOs.Seat;

public class SeatMapDto
{
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public List<SeatSectionDto> Sections { get; set; } = new();
}

public class SeatSectionDto
{
    public string Section { get; set; } = string.Empty;
    public List<SeatRowDto> Rows { get; set; } = new();
}

public class SeatRowDto
{
    public int RowNumber { get; set; }
    public List<SeatDto> Seats { get; set; } = new();
}
