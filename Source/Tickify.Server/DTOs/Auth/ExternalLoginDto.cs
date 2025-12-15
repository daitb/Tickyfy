namespace Tickify.DTOs.Auth;

public class ExternalLoginDto
{
    public string Provider { get; set; } = string.Empty; // "Google" or "Facebook"
    public string IdToken { get; set; } = string.Empty; // Token from OAuth provider
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string? ProviderId { get; set; }
    public string? ProfilePicture { get; set; }
}
