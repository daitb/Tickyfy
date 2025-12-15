using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Models;

namespace Tickify.Repositories;

public class UserRoleRepository : IUserRoleRepository
{
    private readonly ApplicationDbContext _context;

    public UserRoleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddUserRoleAsync(UserRole userRole)
    {
        await _context.UserRoles.AddAsync(userRole);
    }

    public async Task<UserRole?> GetUserRoleAsync(int userId, int roleId)
    {
        return await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
    }

    public async Task<List<UserRole>> GetUserRolesByUserIdAsync(int userId)
    {
        return await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .ToListAsync();
    }

    public async Task RemoveUserRoleAsync(UserRole userRole)
    {
        _context.UserRoles.Remove(userRole);
        await Task.CompletedTask;
    }

    public async Task RemoveUserRolesAsync(IEnumerable<UserRole> userRoles)
    {
        _context.UserRoles.RemoveRange(userRoles);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}