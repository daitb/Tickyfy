namespace Tickify.DTOs.Support;

public class SupportMessageDto
{
    public int MessageId { get; set; }
    public int SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public bool IsStaff { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}
