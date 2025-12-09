namespace Tickify.DTOs.Event;

public class UpdateEventDto
{
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Venue { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalSeats { get; set; }
    public bool IsFeatured { get; set; }
    public int? SeatMapId { get; set; } // ID của seat map
}
