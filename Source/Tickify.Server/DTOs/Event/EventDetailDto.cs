namespace Tickify.DTOs.Event;

public class EventDetailDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Venue { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalSeats { get; set; }
    public int AvailableSeats { get; set; }
    public bool IsFeatured { get; set; }
    public string Status { get; set; } = string.Empty;
    
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    
    public int OrganizerId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public string? OrganizerEmail { get; set; }
    
    public List<TicketTypeDto> TicketTypes { get; set; } = new();
    public int TotalBookings { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class TicketTypeDto
{
    public int TicketTypeId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public int AvailableQuantity { get; set; }
    public string? Description { get; set; }
}
