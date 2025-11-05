namespace Tickify.DTOs.Organizer;

public class CreateOrganizerDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? PhoneNumber { get; set; }
}
