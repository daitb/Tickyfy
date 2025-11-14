namespace Tickify.DTOs.Waitlist;

public class WaitlistDto
{
    public int WaitlistId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public bool Notified { get; set; }
    public DateTime JoinedAt { get; set; }
}
