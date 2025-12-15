namespace Tickify.Models
{
    public class Organizer
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? BusinessRegistrationNumber { get; set; }
        public string? TaxCode { get; set; }
        public string? CompanyAddress { get; set; }
        public string? CompanyPhone { get; set; }
        public string? CompanyEmail { get; set; }
        public string? Website { get; set; }
        public string? Logo { get; set; }
        public string? Description { get; set; }
        public bool IsVerified { get; set; } = false;
        public int? VerifiedByStaffId { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public User? User { get; set; }
        public User? VerifiedByStaff { get; set; }
        public ICollection<Event>? Events { get; set; }
    }
}
