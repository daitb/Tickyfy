using Tickify.Models;

namespace Tickify.Repositories;

public interface IRefreshTokenRepository
{
    Task AddRefreshTokenAsync(RefreshToken refreshToken);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task RemoveRefreshTokenAsync(RefreshToken refreshToken);
    void UpdateRefreshToken(RefreshToken refreshToken);
    Task<List<RefreshToken>> GetRefreshTokensByUserIdAsync(int userId);
    Task SaveChangesAsync();
}