using Tickify.Models;

namespace Tickify.Repositories;

public interface IRoleRepository
{
    Task<Role?> GetRoleByNameAsync(string roleName);
    Task<Role?> GetRoleByIdAsync(int roleId);
    Task<List<Role>> GetAllRolesAsync();
}