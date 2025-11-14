namespace Tickify.DTOs.Organizer;

public class OrganizerProfileDto
{
    public int OrganizerId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsVerified { get; set; }
    public int TotalEvents { get; set; }
    public int UpcomingEvents { get; set; }
    public decimal TotalRevenue { get; set; }
    public DateTime MemberSince { get; set; }
}
