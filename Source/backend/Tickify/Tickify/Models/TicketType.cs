namespace Tickify.Models
{
    public class TicketType
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty; // VIP, Standard, Early Bird, etc.
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int TotalQuantity { get; set; }
        public int AvailableQuantity { get; set; }
        public string? Zone { get; set; } // Zone A, Zone B, etc.
        public bool HasSeatSelection { get; set; } = false;
        public DateTime? SaleStartDate { get; set; }
        public DateTime? SaleEndDate { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Event? Event { get; set; }
        public ICollection<Ticket>? Tickets { get; set; }
        public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    }
}
