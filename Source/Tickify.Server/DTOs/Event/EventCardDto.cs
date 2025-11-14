namespace Tickify.DTOs.Event;

public class EventCardDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime StartDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public decimal MinPrice { get; set; }
    public int AvailableSeats { get; set; }
    public bool IsFeatured { get; set; }
}
