namespace Tickify.Models
{
    public enum TicketStatus
    {
        Valid = 0,
        Used = 1,
        Cancelled = 2,
        Refunded = 3,
        Expired = 4
    }

    public class Ticket
    {
        public int Id { get; set; }
        public string TicketCode { get; set; } = string.Empty; // Unique ticket code/QR code
        public int BookingId { get; set; }
        public int TicketTypeId { get; set; }
        public int? SeatId { get; set; } // Nullable - for reserved seating only
        public string? SeatNumber { get; set; }
        public decimal Price { get; set; }
        public TicketStatus Status { get; set; } = TicketStatus.Valid;
        public DateTime? UsedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Booking? Booking { get; set; }
        public TicketType? TicketType { get; set; }
        public Seat? Seat { get; set; }
    }
}
