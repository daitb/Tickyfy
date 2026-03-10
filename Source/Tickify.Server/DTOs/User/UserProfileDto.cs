namespace Tickify.DTOs.User;

public class UserProfileDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? AvatarUrl { get; set; }
    public bool EmailVerified { get; set; }
    public List<string> Roles { get; set; } = new();
    public int TotalBookings { get; set; }
    public int TotalEventsAttended { get; set; }
    public DateTime MemberSince { get; set; }
}
