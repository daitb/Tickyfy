namespace Tickify.DTOs.Support;

public class CreateSupportTicketDto
{
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public int? RelatedEventId { get; set; }
    public int? RelatedBookingId { get; set; }
}
