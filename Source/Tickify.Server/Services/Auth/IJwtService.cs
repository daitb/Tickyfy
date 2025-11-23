namespace Tickify.Services.Auth;
public interface IJwtService
{
    string GenerateAccessToken(int userId, string email, IList<string> roles, int? organizerId = null);

    string GenerateRefreshToken();

    System.Security.Claims.ClaimsPrincipal? ValidateToken(string token);

    int? GetUserIdFromToken(string token);
}
