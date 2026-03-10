namespace Tickify.Models
{
    public class PromoCode
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty; // "SUMMER2024", "EARLYBIRD"
        public string? Description { get; set; }
        public int? EventId { get; set; } // Null = applies to all events
        public int? OrganizerId { get; set; } // Null = system-wide promo
        public decimal? DiscountPercent { get; set; } // 20% off
        public decimal? DiscountAmount { get; set; } // $10 off
        public decimal? MinimumPurchase { get; set; } // Minimum booking amount to use promo
        public int? MaxUses { get; set; } // Maximum number of times code can be used
        public int CurrentUses { get; set; } = 0; // How many times it's been used
        public int? MaxUsesPerUser { get; set; } // Limit per user (e.g., 1)
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int CreatedByUserId { get; set; }

        // Navigation properties
        public Event? Event { get; set; }
        public Organizer? Organizer { get; set; }
        public User? CreatedByUser { get; set; }
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
