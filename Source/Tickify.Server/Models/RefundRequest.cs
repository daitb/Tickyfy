namespace Tickify.Models
{
    public class RefundRequest
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public decimal RefundAmount { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Processed
        public int? ReviewedByStaffId { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? StaffNotes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
        
        // Navigation properties
        public Booking? Booking { get; set; }
        public User? User { get; set; }
        public User? ReviewedByStaff { get; set; }
    }
}
