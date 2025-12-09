using Tickify.Models;

namespace Tickify.Repositories;

public interface IUserRoleRepository
{
    Task AddUserRoleAsync(UserRole userRole);
    Task<UserRole?> GetUserRoleAsync(int userId, int roleId);
    Task RemoveUserRoleAsync(UserRole userRole);
    Task SaveChangesAsync();
}