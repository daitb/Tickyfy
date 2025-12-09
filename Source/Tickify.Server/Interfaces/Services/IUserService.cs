using Tickify.Common;
using Tickify.DTOs.Auth;
using Tickify.DTOs.User;

namespace Tickify.Interfaces.Services;

public interface IUserService
{
    Task<PagedResult<UserListDto>> GetUsersAsync(int pageNumber, int pageSize, string? searchTerm = null);
    Task<UserDetailDto> GetUserByIdAsync(int userId);
    Task<UserProfileDto> GetCurrentUserProfileAsync(int userId);
    Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto updateDto);
    Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);
    Task AssignRoleAsync(int userId, int roleId);
    Task ToggleActiveStatusAsync(int userId);
    Task SoftDeleteUserAsync(int userId);
    Task<string?> UploadAvatarAsync(int userId, Stream fileStream, string fileName, string contentType);
}
