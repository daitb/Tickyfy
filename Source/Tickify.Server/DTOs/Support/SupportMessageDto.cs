namespace Tickify.DTOs.Support;

public class SupportMessageDto
{
    public int MessageId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsStaffResponse { get; set; }
    public DateTime CreatedAt { get; set; }
}
