namespace Tickify.DTOs.Admin;

public class UpdateRoleDto
{
    public string Role { get; set; } = string.Empty;
}

public class OrganizerRequestDto
{
    public int RequestId { get; set; }
    public int UserId { get; set; }
    public UserBasicDto User { get; set; } = null!;
    public string OrganizationName { get; set; } = string.Empty;
    public string BusinessRegistration { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
}

public class UserBasicDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
