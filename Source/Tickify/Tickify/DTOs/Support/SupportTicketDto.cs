using Tickify.DTOs.User;

namespace Tickify.DTOs.Support
{
    public class SupportTicketDto
    {
        public Guid Id { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // open, in_progress, resolved, closed
        public UserDto? User { get; set; }
        public UserDto? AssignedTo { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public int MessageCount { get; set; }
    }
}