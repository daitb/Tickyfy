namespace Tickify.DTOs.Chat
{
    public class SendMessageDto
    {
        public int ChatConversationId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}

