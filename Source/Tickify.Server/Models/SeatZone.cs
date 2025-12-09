namespace Tickify.Models
{
    /// <summary>
    /// Represents a zone/section in the seat map (e.g., VIP Section, General Admission)
    /// </summary>
    public class SeatZone
    {
        public int Id { get; set; }
        public int SeatMapId { get; set; }
        public int TicketTypeId { get; set; }
        
        public string Name { get; set; } = string.Empty; // e.g., "VIP Zone A", "Section B"
        public string? Color { get; set; } // Hex color for visualization
        public string? Description { get; set; }
        
        // Position in the layout
        public int StartRow { get; set; }
        public int EndRow { get; set; }
        public int StartColumn { get; set; }
        public int EndColumn { get; set; }
        
        // Pricing
        public decimal ZonePrice { get; set; }
        public int Capacity { get; set; } // Total seats in this zone
        public int AvailableSeats { get; set; }
        
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public SeatMap? SeatMap { get; set; }
        public TicketType? TicketType { get; set; }
        public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    }
}
