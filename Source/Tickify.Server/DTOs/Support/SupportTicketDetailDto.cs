namespace Tickify.DTOs.Support;

public class SupportTicketDetailDto
{
    public int TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public int? RelatedEventId { get; set; }
    public string? RelatedEventTitle { get; set; }
    public int? RelatedBookingId { get; set; }
    public string? RelatedBookingNumber { get; set; }
    public List<SupportMessageDto> Messages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
