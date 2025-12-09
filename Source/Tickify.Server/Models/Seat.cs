namespace Tickify.Models
{
    public enum SeatStatus
    {
        Available,
        Selected,
        Sold,
        Blocked,
        Reserved
    }

    public class Seat
    {
        public int Id { get; set; }
        public int TicketTypeId { get; set; }
        public int? SeatZoneId { get; set; } // Optional: which zone this seat belongs to
        
        public string Row { get; set; } = string.Empty; // e.g., "A", "B", "1", "2"
        public string SeatNumber { get; set; } = string.Empty; // e.g., "1", "2", "15"
        public string FullSeatCode => $"{Row}{SeatNumber}"; // e.g., "A15"
        
        // Position in the grid (for visual representation)
        public int? GridRow { get; set; }
        public int? GridColumn { get; set; }
        
        // Status and availability
        public SeatStatus Status { get; set; } = SeatStatus.Available;
        public bool IsBlocked { get; set; } = false;
        public string? BlockedReason { get; set; }
        public bool IsWheelchair { get; set; } = false; // Wheelchair accessible seat
        
        // Reservation handling (temporary hold during checkout)
        public int? ReservedByUserId { get; set; }
        public DateTime? ReservedUntil { get; set; }
        
        // Admin lock functionality (for VIP/sponsor seats)
        public bool IsAdminLocked { get; set; } = false;
        public string? AdminLockedReason { get; set; }
        public int? LockedByAdminId { get; set; }
        public DateTime? LockedAt { get; set; }
        
        // Seat hold extension tracking
        public bool HasExtendedReservation { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public TicketType TicketType { get; set; } = null!;
        public SeatZone? SeatZone { get; set; }
        public User? ReservedByUser { get; set; }
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
