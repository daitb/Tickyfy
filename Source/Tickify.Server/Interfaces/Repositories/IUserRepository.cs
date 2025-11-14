using Tickify.Models;

namespace Tickify.Repositories;

public interface IUserRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(int userId);
    Task LoadUserRolesAsync(User user);
    Task AddUserAsync(User user);
    void UpdateUser(User user);
    Task SaveChangesAsync();
    Task<User?> GetUserByEmailVerificationTokenAsync(string token);
    Task<User?> GetUserByPasswordResetTokenAsync(string token);
}