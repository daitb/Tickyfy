namespace Tickify.DTOs.Support;

public class AddMessageDto
{
    public int TicketId { get; set; }
    public string Message { get; set; } = string.Empty;
}
