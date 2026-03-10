namespace Tickify.DTOs.Event;

public class RejectEventDto
{
    public int EventId { get; set; }
    public string Reason { get; set; } = string.Empty;
}
