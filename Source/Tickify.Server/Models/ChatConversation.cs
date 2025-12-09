namespace Tickify.Models
{
    public class ChatConversation
    {
        public int Id { get; set; }
        public int UserId { get; set; } // Customer
        public int? StaffId { get; set; } // Staff member (null if not assigned yet)
        public string Status { get; set; } = "Open"; // Open, InProgress, Closed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        
        // Navigation properties
        public User User { get; set; } = null!;
        public User? Staff { get; set; }
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}

