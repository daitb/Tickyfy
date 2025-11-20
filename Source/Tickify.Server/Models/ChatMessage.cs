namespace Tickify.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public int ChatConversationId { get; set; }
        public int SenderId { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsStaffMessage { get; set; } // true if sent by staff, false if by customer
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        
        // Navigation properties
        public ChatConversation ChatConversation { get; set; } = null!;
        public User Sender { get; set; } = null!;
    }
}

