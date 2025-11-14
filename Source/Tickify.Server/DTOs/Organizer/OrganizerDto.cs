namespace Tickify.DTOs.Organizer;

public class OrganizerDto
{
    public int OrganizerId { get; set; }
    public int UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
}
