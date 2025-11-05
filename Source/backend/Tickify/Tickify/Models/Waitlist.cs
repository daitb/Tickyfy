namespace Tickify.Models
{
    public class Waitlist
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int EventId { get; set; }
        public int? TicketTypeId { get; set; } // Null = any ticket type
        public int RequestedQuantity { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public bool IsNotified { get; set; } = false;
        public DateTime? NotifiedAt { get; set; }
        public DateTime? ExpiresAt { get; set; } // Time limit to purchase after notification
        public bool HasPurchased { get; set; } = false;
        public DateTime? PurchasedAt { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
        public Event Event { get; set; } = null!;
        public TicketType? TicketType { get; set; }
    }
}
