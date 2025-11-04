using Tickify.DTOs.Common;

namespace Tickify.DTOs.Review
{
    public class ReviewDto
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public BasicUserInfo User { get; set; } = new();
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool IsAnonymous { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Event info for display
        public BasicEventInfo? Event { get; set; }
    }
}