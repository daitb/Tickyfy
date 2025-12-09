using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Auth;
using Tickify.DTOs.User;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/users - List users (Admin only, with pagination and search)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UserListDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] bool? emailVerified = null)
    {
        var result = await _userService.GetUsersAsync(pageNumber, pageSize, searchTerm, role, isActive, emailVerified);

        _logger.LogInformation("Admin retrieved users list. Page: {PageNumber}, Size: {PageSize}, Search: {SearchTerm}, Role: {Role}, IsActive: {IsActive}, EmailVerified: {EmailVerified}",
            pageNumber, pageSize, searchTerm, role, isActive, emailVerified);

        return Ok(ApiResponse<PagedResult<UserListDto>>.SuccessResponse(
            result,
            "Lấy danh sách người dùng thành công"
        ));
    }

    /// <summary>
    /// GET /api/users/{id} - Get user by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);

        _logger.LogInformation("Admin retrieved user details for UserId: {UserId}", id);

        return Ok(ApiResponse<UserDetailDto>.SuccessResponse(
            user,
            "Lấy thông tin người dùng thành công"
        ));
    }

    /// <summary>
    /// GET /api/users/profile - Get current user profile (JWT authenticated)
    /// </summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUserProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("Không thể xác thực người dùng"));
        }

        var profile = await _userService.GetCurrentUserProfileAsync(userId);

        _logger.LogInformation("User {UserId} retrieved their profile", userId);

        return Ok(ApiResponse<UserProfileDto>.SuccessResponse(
            profile,
            "Lấy thông tin profile thành công"
        ));
    }

    /// <summary>
    /// PUT /api/users/profile - Update current user profile
    /// </summary>
    [HttpPut("profile")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("Không thể xác thực người dùng"));
        }

        var updatedProfile = await _userService.UpdateProfileAsync(userId, updateDto);

        _logger.LogInformation("User {UserId} updated their profile", userId);

        return Ok(ApiResponse<UserProfileDto>.SuccessResponse(
            updatedProfile,
            "Cập nhật profile thành công"
        ));
    }

    /// <summary>
    /// POST /api/users/{id}/assign-role - Assign role to user (Admin only)
    /// </summary>
    [HttpPost("{id}/assign-role")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRole(int id, [FromBody] AssignRoleDto assignRoleDto)
    {
        // Use the id from route, not from DTO
        await _userService.AssignRoleAsync(id, assignRoleDto.RoleId);

        _logger.LogInformation("Admin assigned role {RoleId} to user {UserId}", assignRoleDto.RoleId, id);

        return Ok(ApiResponse<object>.SuccessResponse(
            new { },
            "Gán vai trò thành công"
        ));
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleActiveStatus(int id)
    {
        await _userService.ToggleActiveStatusAsync(id);

        _logger.LogInformation("Admin toggled active status for user {UserId}", id);

        return Ok(ApiResponse<object>.SuccessResponse(
            new { },
            "Cập nhật trạng thái người dùng thành công"
        ));
    }

    /// <summary>
    /// DELETE /api/users/{id} - Soft delete user (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        await _userService.SoftDeleteUserAsync(id);

        _logger.LogInformation("Admin soft deleted user {UserId}", id);

        return Ok(ApiResponse<object>.SuccessResponse(
            new { },
            "Xóa người dùng thành công"
        ));
    }

    /// <summary>
    /// POST /api/users/profile/avatar - Upload avatar for current user
    /// </summary>
    [HttpPost("profile/avatar")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("Không thể xác thực người dùng"));
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Vui lòng chọn file để upload"));
        }

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)"));
        }

        // Validate file size (5MB max)
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Kích thước file không được vượt quá 5MB"));
        }

        using var stream = file.OpenReadStream();
        var avatarUrl = await _userService.UploadAvatarAsync(userId, stream, file.FileName, file.ContentType);

        _logger.LogInformation("User {UserId} uploaded avatar", userId);

        return Ok(ApiResponse<string>.SuccessResponse(
            avatarUrl ?? string.Empty,
            "Upload avatar thành công"
        ));
    }
}
