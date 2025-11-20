namespace Tickify.DTOs.Chat
{
    public class ChatMessageDto
    {
        public int Id { get; set; }
        public int ChatConversationId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderProfilePicture { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsStaffMessage { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
    }
}

