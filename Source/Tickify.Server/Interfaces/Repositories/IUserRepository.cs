using Tickify.Models;

namespace Tickify.Repositories;

public interface IUserRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(int userId);
    Task<(List<User> Users, int TotalCount)> GetUsersAsync(int pageNumber, int pageSize, string? searchTerm = null);
    Task LoadUserRolesAsync(User user);
    Task AddUserAsync(User user);
    void UpdateUser(User user);
    Task SaveChangesAsync();
    Task<User?> GetUserByEmailVerificationTokenAsync(string token);
    Task<User?> GetUserByPasswordResetTokenAsync(string token);
    Task<User?> GetUserByProviderAsync(string provider, string providerId);
    Task<int> GetTotalBookingsCountAsync(int userId);
    Task<int> GetTotalEventsAttendedCountAsync(int userId);
}