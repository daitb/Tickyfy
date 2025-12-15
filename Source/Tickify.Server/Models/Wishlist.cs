namespace Tickify.Models
{
    public class Wishlist
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int EventId { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public User? User { get; set; }
        public Event? Event { get; set; }
    }
}
