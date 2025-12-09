namespace Tickify.DTOs.Waitlist;

public class WaitlistDto
{
    public int WaitlistId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public string? EventBanner { get; set; }
    public DateTime EventDate { get; set; }
    public string? EventLocation { get; set; }
    public int? TicketTypeId { get; set; }
    public string? TicketTypeName { get; set; }
    public int RequestedQuantity { get; set; }
    public string Status { get; set; } = "active"; // active, notified, expired, purchased
    public bool IsNotified { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool HasPurchased { get; set; }
    public DateTime JoinedAt { get; set; }
    public int Position { get; set; } // Position in queue
}
