namespace Tickify.Models
{
    public enum BookingStatus
    {
        Pending,
        Confirmed,
        Cancelled,
        Refunded,
        Expired
    }

    public class Booking
    {
        public int Id { get; set; }
        public string BookingCode { get; set; } = string.Empty; // Unique booking reference
        public int UserId { get; set; }
        public int EventId { get; set; }
        public decimal TotalAmount { get; set; }
        public int? PromoCodeId { get; set; } // Applied promo code
        public decimal DiscountAmount { get; set; } = 0; // Discount applied from promo code
        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; } // Booking expires if not paid (typically 10-15 minutes)
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }
        public bool IsRefundRequested { get; set; } = false;
        public bool IsRefunded { get; set; } = false;
        public DateTime? RefundedAt { get; set; }
        
        // Store selected seat IDs for seat-based bookings (JSON array)
        public string? SeatIdsJson { get; set; }

        // Computed property
        public bool IsExpired => ExpiresAt.HasValue && DateTime.UtcNow > ExpiresAt && Status == BookingStatus.Pending;

        // Navigation properties
        public User? User { get; set; }
        public Event? Event { get; set; }
        public PromoCode? PromoCode { get; set; }
        public ICollection<Ticket>? Tickets { get; set; }
        public Payment? Payment { get; set; }
    }
}
