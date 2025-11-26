namespace Tickify.DTOs.Wishlist;

public class WishlistDto
{
    public int WishlistId { get; set; }
    public int UserId { get; set; }
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public string? EventImageUrl { get; set; }
    public DateTime EventStartDate { get; set; }
    public string EventVenue { get; set; } = string.Empty;
    public string EventCity { get; set; } = string.Empty;
    public string EventCategory { get; set; } = string.Empty;
    public string EventStatus { get; set; } = string.Empty;
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public int AvailableTickets { get; set; }
    public int TotalTickets { get; set; }
    public bool IsEventActive { get; set; }
    public DateTime AddedAt { get; set; }
}
