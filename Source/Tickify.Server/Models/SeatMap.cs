namespace Tickify.Models
{
    /// <summary>
    /// Represents the seat map layout configuration for an event
    /// </summary>
    public class SeatMap
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty; // e.g., "Main Hall", "Stadium"
        public string? Description { get; set; }
        
        // Layout configuration stored as JSON
        public string LayoutConfig { get; set; } = "{}"; // Stores grid/SVG configuration
        
        public int TotalRows { get; set; }
        public int TotalColumns { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Event? Event { get; set; }
        public ICollection<SeatZone> Zones { get; set; } = new List<SeatZone>();
    }
}
