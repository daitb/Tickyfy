using Tickify.Models;

namespace Tickify.Repositories;

public interface IUserRoleRepository
{
    Task AddUserRoleAsync(UserRole userRole);
}