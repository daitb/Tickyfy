namespace Tickify.Services.Auth;

/// <summary>
/// Interface cho JWT Service
/// Xử lý: Generate Token, Validate Token, Get Claims
/// </summary>
public interface IJwtService
{
    /// <summary>
    /// Tạo JWT Access Token cho user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="email">Email</param>
    /// <param name="roles">Danh sách roles của user</param>
    /// <returns>JWT token string</returns>
    string GenerateAccessToken(int userId, string email, IList<string> roles);

    /// <summary>
    /// Tạo Refresh Token
    /// </summary>
    /// <returns>Refresh token string</returns>
    string GenerateRefreshToken();

    /// <summary>
    /// Validate JWT Token và trả về principal
    /// </summary>
    /// <param name="token">JWT token</param>
    /// <returns>ClaimsPrincipal nếu valid, null nếu invalid</returns>
    System.Security.Claims.ClaimsPrincipal? ValidateToken(string token);

    /// <summary>
    /// Get User ID từ token
    /// </summary>
    /// <param name="token">JWT token</param>
    /// <returns>User ID nếu valid, null nếu invalid</returns>
    int? GetUserIdFromToken(string token);
}
