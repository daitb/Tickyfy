namespace Tickify.Models
{
    public class SupportMessage
    {
        public int Id { get; set; }
        public int SupportTicketId { get; set; }
        public int? UserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsStaffReply { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public SupportTicket? SupportTicket { get; set; }
        public User? User { get; set; }
    }
}
