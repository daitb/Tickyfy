namespace Tickify.DTOs.Auth;

public class OrganizerRequestDto
{
    public string OrganizationName { get; set; } = string.Empty;
    public string BusinessRegistration { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Description { get; set; }
}
