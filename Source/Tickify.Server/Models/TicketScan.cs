namespace Tickify.Models
{
    public class TicketScan
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public DateTime ScannedAt { get; set; }
        public int ScannedByUserId { get; set; }
        public string ScanLocation { get; set; } = string.Empty; // "Entrance Gate A", "VIP Lounge"
        public string ScanType { get; set; } = "Entry"; // Entry, Re-entry, Exit
        public string? DeviceId { get; set; }
        public bool IsValid { get; set; } = true;
        public string? Notes { get; set; }

        // Navigation properties
        public Ticket Ticket { get; set; } = null!;
        public User ScannedByUser { get; set; } = null!;
    }
}
