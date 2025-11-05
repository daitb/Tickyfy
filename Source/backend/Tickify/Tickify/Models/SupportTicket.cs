namespace Tickify.Models
{
    public class SupportTicket
    {
        public int Id { get; set; }
        public int? UserId { get; set; } // Null for guest
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed
        public string Priority { get; set; } = "Normal"; // Low, Normal, High, Urgent
        public int? AssignedToStaffId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
        
        // Navigation properties
        public User? User { get; set; }
        public User? AssignedToStaff { get; set; }
        public ICollection<SupportMessage>? Messages { get; set; }
    }
}
