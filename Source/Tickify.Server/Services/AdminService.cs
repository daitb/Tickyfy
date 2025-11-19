using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Admin;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRoleRepository _userRoleRepository;

    public AdminService(
        ApplicationDbContext context,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IUserRoleRepository userRoleRepository)
    {
        _context = context;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
    }

    public async Task<List<UserListDto>> GetAllUsersAsync(int pageNumber, int pageSize)
    {
        var users = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .OrderByDescending(u => u.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return users.Select(u => new UserListDto
        {
            UserId = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            Role = u.UserRoles.FirstOrDefault()?.Role.Name ?? "User",
            IsEmailVerified = u.IsEmailVerified,
            CreatedAt = u.CreatedAt
        }).ToList();
    }

    public async Task UpdateUserRoleAsync(int userId, string roleName)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("Người dùng không tồn tại");
        }

        var role = await _roleRepository.GetRoleByNameAsync(roleName);
        if (role == null)
        {
            throw new NotFoundException($"Role {roleName} không tồn tại");
        }

        // Remove all existing roles
        var existingRoles = await _context.UserRoles.Where(ur => ur.UserId == userId).ToListAsync();
        _context.UserRoles.RemoveRange(existingRoles);

        // Add new role
        var userRole = new UserRole
        {
            UserId = userId,
            RoleId = role.Id
        };
        await _context.UserRoles.AddAsync(userRole);
        await _context.SaveChangesAsync();
    }

    public async Task<List<OrganizerRequestDto>> GetOrganizerRequestsAsync()
    {
        var requests = await _context.OrganizerRequests
            .Include(r => r.User)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();

        return requests.Select(r => new OrganizerRequestDto
        {
            RequestId = r.RequestId,
            UserId = r.UserId,
            User = new UserBasicDto
            {
                FullName = r.User.FullName,
                Email = r.User.Email
            },
            OrganizationName = r.OrganizationName,
            BusinessRegistration = r.BusinessRegistration,
            PhoneNumber = r.PhoneNumber,
            Address = r.Address,
            Description = r.Description,
            Status = r.Status,
            RequestedAt = r.RequestedAt
        }).ToList();
    }

    public async Task ApproveOrganizerRequestAsync(int requestId, int adminId)
    {
        var request = await _context.OrganizerRequests
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
        {
            throw new NotFoundException("Yêu cầu không tồn tại");
        }

        if (request.Status != "Pending")
        {
            throw new BadRequestException("Yêu cầu đã được xử lý");
        }

        // Update request status
        request.Status = "Approved";
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByAdminId = adminId;

        // Update user role to Organizer
        var organizerRole = await _roleRepository.GetRoleByNameAsync("Organizer");
        if (organizerRole == null)
        {
            throw new NotFoundException("Role Organizer không tồn tại");
        }

        // Remove existing user role
        var existingRoles = await _context.UserRoles.Where(ur => ur.UserId == request.UserId).ToListAsync();
        _context.UserRoles.RemoveRange(existingRoles);

        // Add Organizer role
        var userRole = new UserRole
        {
            UserId = request.UserId,
            RoleId = organizerRole.Id
        };
        await _context.UserRoles.AddAsync(userRole);

        // Create Organizer record
        var organizer = new Organizer
        {
            UserId = request.UserId,
            CompanyName = request.OrganizationName,
            CompanyEmail = request.User.Email,
            CompanyPhone = request.PhoneNumber,
            CompanyAddress = request.Address,
            BusinessRegistrationNumber = request.BusinessRegistration,
            Description = request.Description,
            IsVerified = true,
            VerifiedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        await _context.Organizers.AddAsync(organizer);

        await _context.SaveChangesAsync();

        // TODO: Send email notification to user
    }

    public async Task RejectOrganizerRequestAsync(int requestId, int adminId)
    {
        var request = await _context.OrganizerRequests
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
        {
            throw new NotFoundException("Yêu cầu không tồn tại");
        }

        if (request.Status != "Pending")
        {
            throw new BadRequestException("Yêu cầu đã được xử lý");
        }

        request.Status = "Rejected";
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByAdminId = adminId;

        await _context.SaveChangesAsync();

        // TODO: Send email notification to user
    }
}
