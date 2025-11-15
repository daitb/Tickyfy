using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Models;

namespace Tickify.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
        .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
        .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users
        .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
        .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<(List<User> Users, int TotalCount)> GetUsersAsync(int pageNumber, int pageSize, string? searchTerm = null)
    {
        var query = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            searchTerm = searchTerm.ToLower();
            query = query.Where(u => 
                u.Email.ToLower().Contains(searchTerm) || 
                u.FullName.ToLower().Contains(searchTerm) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(searchTerm))
            );
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (users, totalCount);
    }

    public async Task LoadUserRolesAsync(User user)
    {
        await _context.Entry(user)
            .Collection(u => u.UserRoles)
            .Query()
            .Include(ur => ur.Role)
            .LoadAsync();
    }

    public async Task AddUserAsync(User user)
    {
        await _context.Users.AddAsync(user);
    }

    public void UpdateUser(User user)
    {
        _context.Users.Update(user);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<User?> GetUserByEmailVerificationTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
    }

    public async Task<User?> GetUserByPasswordResetTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token);
    }

    public async Task<User?> GetUserByProviderAsync(string provider, string providerId)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.AuthProvider == provider && u.ProviderId == providerId);
    }

    public async Task<int> GetTotalBookingsCountAsync(int userId)
    {
        return await _context.Bookings
            .Where(b => b.UserId == userId)
            .CountAsync();
    }

    public async Task<int> GetTotalEventsAttendedCountAsync(int userId)
    {
        return await _context.Bookings
            .Where(b => b.UserId == userId && b.Status == BookingStatus.Confirmed)
            .Select(b => b.EventId)
            .Distinct()
            .CountAsync();
    }
}