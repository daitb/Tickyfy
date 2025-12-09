using Tickify.Models;

namespace Tickify.Repositories;

public interface IUserRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(int userId);
    Task<(List<User> Users, int TotalCount)> GetUsersAsync(int pageNumber, int pageSize, string? searchTerm = null, string? role = null, bool? isActive = null, bool? emailVerified = null);
    Task LoadUserRolesAsync(User user);
    Task AddUserAsync(User user);
    void UpdateUser(User user);
    Task SaveChangesAsync();
    Task<User?> GetUserByEmailVerificationTokenAsync(string token);
    Task<User?> GetUserByPasswordResetTokenAsync(string token);
    Task<User?> GetUserByProviderAsync(string provider, string providerId);
    Task<User> GetByIdAsync(int id);
    Task<User> GetByEmailAsync(string email);
    Task<int> GetTotalBookingsCountAsync(int userId);
    Task<int> GetTotalEventsAttendedCountAsync(int userId);
    Task<OrganizerRequest?> GetPendingOrganizerRequestAsync(int userId);
    Task AddOrganizerRequestAsync(OrganizerRequest request);
    Task<List<User>> GetUsersByRoleAsync(string roleName);
    Task<Organizer?> GetOrganizerByUserIdAsync(int userId);


}