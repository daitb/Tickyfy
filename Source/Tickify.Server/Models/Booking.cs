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
        
        // Ticket information - needed for restoring quantity when booking expires/cancels
        public int TicketTypeId { get; set; } // Which ticket type was booked
        public int Quantity { get; set; } // Number of tickets booked
        
        // Pricing information
        public decimal OriginalAmount { get; set; } // Total before any discounts
        public decimal TotalAmount { get; set; } // Final amount after discounts
        public int? PromoCodeId { get; set; } // Applied promo code
        public decimal DiscountAmount { get; set; } = 0; // Discount applied from promo code
        
        // Seat information - stored as JSON array for pending bookings (before tickets created)
        public string? SeatIdsJson { get; set; } // JSON array: "[1,2,3]" - needed to release seats on cancel/expire
        
        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; } // Booking expires if not paid (typically 10-15 minutes)
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }
        public bool IsRefundRequested { get; set; } = false;
        public bool IsRefunded { get; set; } = false;
        public DateTime? RefundedAt { get; set; }

        // Computed property
        public bool IsExpired => ExpiresAt.HasValue && DateTime.UtcNow > ExpiresAt && Status == BookingStatus.Pending;

        // Navigation properties
        public User? User { get; set; }
        public Event? Event { get; set; }
        public TicketType? TicketType { get; set; }
        public PromoCode? PromoCode { get; set; }
        public ICollection<Ticket>? Tickets { get; set; }
        public Payment? Payment { get; set; }
    }
}
