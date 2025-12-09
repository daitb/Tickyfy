namespace Tickify.Models
{
    public enum EventStatus
    {
        Pending,
        Approved,
        Rejected,
        Published,
        Cancelled,
        Completed
    }

    public class Event
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? BannerImage { get; set; }
        public string? PosterImage { get; set; }
        public string Location { get; set; } = string.Empty;
        public string? Address { get; set; }
        public int? MaxCapacity { get; set; } // Maximum venue capacity
        public int? MinimumAge { get; set; } // Age restriction (18+ events)
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public EventStatus Status { get; set; } = EventStatus.Pending;
        public int OrganizerId { get; set; }
        public int CategoryId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public int? ApprovedByStaffId { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? RejectionReason { get; set; }

        // Navigation properties
        public Organizer? Organizer { get; set; }
        public Category? Category { get; set; }
        public User? ApprovedByStaff { get; set; }
        public SeatMap? SeatMap { get; set; }
        public ICollection<TicketType>? TicketTypes { get; set; }
        public ICollection<Booking>? Bookings { get; set; }
        public ICollection<Review>? Reviews { get; set; }
        public ICollection<Wishlist>? Wishlists { get; set; }
    }
}
