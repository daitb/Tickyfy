namespace Tickify.DTOs.Event;

/// <summary>
/// DTO for admin event analytics data (used in admin dashboard charts)
/// </summary>
public class EventAnalyticsDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? BannerImage { get; set; }
    public string? PosterImage { get; set; }
    public string Location { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string OrganizerName { get; set; } = string.Empty;
    public int OrganizerId { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Analytics fields
    public decimal Revenue { get; set; } // Total revenue from ticket sales
    public int SoldTickets { get; set; } // Total tickets sold
    public int Capacity { get; set; } // Total event capacity (sum of all ticket types)
    public double SalesRate { get; set; } // Percentage of tickets sold (soldTickets / capacity * 100)
}
