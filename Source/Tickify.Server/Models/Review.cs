namespace Tickify.Models
{
    public class Review
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int EventId { get; set; }
        public int Rating { get; set; } // 1-5 stars
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public User? User { get; set; }
        public Event? Event { get; set; }
    }
}
