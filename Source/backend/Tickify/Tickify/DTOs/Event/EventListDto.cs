namespace Tickify.DTOs.Event;

public class EventListDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Venue { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string OrganizerName { get; set; } = string.Empty;
    public int AvailableSeats { get; set; }
    public decimal MinPrice { get; set; }
    public bool IsFeatured { get; set; }
    public string Status { get; set; } = string.Empty;
}
