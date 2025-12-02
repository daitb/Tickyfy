using Tickify.Models;

namespace Tickify.Repositories;

public interface IUserRoleRepository
{
    Task AddUserRoleAsync(UserRole userRole);
    Task<UserRole?> GetUserRoleAsync(int userId, int roleId);
    Task<List<UserRole>> GetUserRolesByUserIdAsync(int userId);
    Task RemoveUserRoleAsync(UserRole userRole);
    Task RemoveUserRolesAsync(IEnumerable<UserRole> userRoles);
    Task SaveChangesAsync();
}