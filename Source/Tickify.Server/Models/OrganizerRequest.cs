namespace Tickify.Models;

public class OrganizerRequest
{
    public int RequestId { get; set; }
    public int UserId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string BusinessRegistration { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public string? ReviewNotes { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public User? ReviewedByAdmin { get; set; }
}
