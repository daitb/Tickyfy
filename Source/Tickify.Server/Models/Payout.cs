namespace Tickify.Models
{
    public class Payout
    {
        public int Id { get; set; }
        public int OrganizerId { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Approved, Processed, Rejected
        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankAccountName { get; set; }
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public int? ProcessedByStaffId { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? Notes { get; set; }
        
        // Navigation properties
        public Organizer? Organizer { get; set; }
        public User? ProcessedByStaff { get; set; }
    }
}
