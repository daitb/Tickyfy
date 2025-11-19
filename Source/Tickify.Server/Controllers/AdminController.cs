using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Common;
using Tickify.DTOs.Admin;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<List<UserListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
    {
        var users = await _adminService.GetAllUsersAsync(pageNumber, pageSize);
        return Ok(ApiResponse<List<UserListDto>>.SuccessResponse(users, "Lấy danh sách người dùng thành công"));
    }

    [HttpPut("users/{userId}/role")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateRoleDto updateRoleDto)
    {
        await _adminService.UpdateUserRoleAsync(userId, updateRoleDto.Role);
        _logger.LogInformation("Admin updated user {UserId} role to {Role}", userId, updateRoleDto.Role);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Cập nhật role thành công"));
    }

    [HttpGet("organizer-requests")]
    [ProducesResponseType(typeof(ApiResponse<List<OrganizerRequestDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrganizerRequests()
    {
        var requests = await _adminService.GetOrganizerRequestsAsync();
        return Ok(ApiResponse<List<OrganizerRequestDto>>.SuccessResponse(requests, "Lấy danh sách yêu cầu thành công"));
    }

    [HttpPost("organizer-requests/{requestId}/approve")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ApproveOrganizerRequest(int requestId)
    {
        var adminIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized(ApiResponse<object?>.FailureResponse("Không thể xác định admin"));
        }

        await _adminService.ApproveOrganizerRequestAsync(requestId, adminId);
        _logger.LogInformation("Admin {AdminId} approved organizer request {RequestId}", adminId, requestId);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Phê duyệt yêu cầu thành công"));
    }

    [HttpPost("organizer-requests/{requestId}/reject")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RejectOrganizerRequest(int requestId)
    {
        var adminIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized(ApiResponse<object?>.FailureResponse("Không thể xác định admin"));
        }

        await _adminService.RejectOrganizerRequestAsync(requestId, adminId);
        _logger.LogInformation("Admin {AdminId} rejected organizer request {RequestId}", adminId, requestId);
        return Ok(ApiResponse<object?>.SuccessResponse(null, "Từ chối yêu cầu thành công"));
    }
}
