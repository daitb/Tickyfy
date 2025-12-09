using AutoMapper;
using Tickify.Common;
using Tickify.DTOs.Auth;
using Tickify.DTOs.User;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IFileUploadService _fileUploadService;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        IUserRoleRepository userRoleRepository,
        IRoleRepository roleRepository,
        IFileUploadService fileUploadService,
        IMapper mapper,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
        _fileUploadService = fileUploadService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<UserListDto>> GetUsersAsync(int pageNumber, int pageSize, string? searchTerm = null)
    {
        var (users, totalCount) = await _userRepository.GetUsersAsync(pageNumber, pageSize, searchTerm);

        var userListDtos = users.Select(u => new UserListDto
        {
            UserId = u.Id,
            Email = u.Email,
            FullName = u.FullName,
            PhoneNumber = u.PhoneNumber,
            AvatarUrl = u.ProfilePicture,
            IsActive = u.IsActive,
            EmailVerified = u.IsEmailVerified,
            Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
            CreatedAt = u.CreatedAt
        }).ToList();

        return new PagedResult<UserListDto>(userListDtos, totalCount, pageNumber, pageSize);
    }

    public async Task<UserDetailDto> GetUserByIdAsync(int userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"Không tìm thấy người dùng với ID {userId}");
        }

        return new UserDetailDto
        {
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.ProfilePicture,
            IsActive = user.IsActive,
            EmailVerified = user.IsEmailVerified,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task<UserProfileDto> GetCurrentUserProfileAsync(int userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"Không tìm thấy người dùng với ID {userId}");
        }

        var totalBookings = await _userRepository.GetTotalBookingsCountAsync(userId);
        var totalEventsAttended = await _userRepository.GetTotalEventsAttendedCountAsync(userId);

        return new UserProfileDto
        {
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.ProfilePicture,
            EmailVerified = user.IsEmailVerified,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            TotalBookings = totalBookings,
            TotalEventsAttended = totalEventsAttended,
            MemberSince = user.CreatedAt
        };
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto updateDto)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"Không tìm thấy người dùng với ID {userId}");
        }

        // Update user properties
        user.FullName = updateDto.FullName;
        user.PhoneNumber = updateDto.PhoneNumber;
        user.DateOfBirth = updateDto.DateOfBirth;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation("User profile updated for UserId: {UserId}", userId);

        return await GetCurrentUserProfileAsync(userId);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"Không tìm thấy người dùng với ID {userId}");
        }

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
        {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        // Verify new password matches confirmation
        if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
        {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        // Hash and update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation("Password changed for UserId: {UserId}", userId);
    }

    public async Task AssignRoleAsync(int userId, int roleId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"Không tìm thấy người dùng với ID {userId}");
        }

        var role = await _roleRepository.GetRoleByIdAsync(roleId);
        if (role == null)
        {
            throw new NotFoundException($"Không tìm thấy vai trò với ID {roleId}");
        }

        // Check if user already has this role
        var existingUserRole = await _userRoleRepository.GetUserRoleAsync(userId, roleId);
        if (existingUserRole != null)
        {
            throw new BadRequestException("Người dùng đã có vai trò này");
        }

        var userRole = new UserRole
        {
            UserId = userId,
            RoleId = roleId,
            AssignedAt = DateTime.UtcNow
        };

        await _userRoleRepository.AddUserRoleAsync(userRole);
        await _userRoleRepository.SaveChangesAsync();

        _logger.LogInformation("Role {RoleId} assigned to UserId: {UserId}", roleId, userId);
    }

    public async Task ToggleActiveStatusAsync(int userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"Không tìm thấy người dùng với ID {userId}");
        }

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation("User {UserId} active status toggled to {IsActive}", userId, user.IsActive);
    }

    public async Task SoftDeleteUserAsync(int userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"Không tìm thấy người dùng với ID {userId}");
        }

        // Soft delete by deactivating
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation("User {UserId} soft deleted", userId);
    }

    public async Task<string?> UploadAvatarAsync(int userId, Stream fileStream, string fileName, string contentType)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"Không tìm thấy người dùng với ID {userId}");
        }

        // Delete old avatar if exists
        if (!string.IsNullOrWhiteSpace(user.ProfilePicture))
        {
            try
            {
                await _fileUploadService.DeleteFileAsync(user.ProfilePicture, "avatars");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete old avatar for UserId: {UserId}", userId);
            }
        }

        // Upload new avatar
        var avatarUrl = await _fileUploadService.UploadFileAsync(fileStream, fileName, "avatars", contentType);

        user.ProfilePicture = avatarUrl;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation("Avatar uploaded for UserId: {UserId}", userId);

        return avatarUrl;
    }
}
