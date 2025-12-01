using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Admin;
using Tickify.Interfaces.Services;
using Tickify.Services.Email;

namespace Tickify.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, IEmailService emailService, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/admin/organizer-requests - Get all organizer requests
    /// </summary>
    [HttpGet("organizer-requests")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrganizerRequests()
    {
        var requests = await _adminService.GetAllOrganizerRequestsAsync();
        return Ok(ApiResponse<object>.SuccessResponse(requests, $"Retrieved {requests.Count} organizer requests"));
    }

    /// <summary>
    /// GET /api/admin/organizer-requests/{id} - Get organizer request by ID
    /// </summary>
    [HttpGet("organizer-requests/{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrganizerRequestById(int id)
    {
        var request = await _adminService.GetOrganizerRequestByIdAsync(id);
        if (request == null)
            return NotFound(ApiResponse<object>.FailureResponse($"Request with ID {id} not found"));

        return Ok(ApiResponse<object>.SuccessResponse(request, "Request retrieved successfully"));
    }

    /// <summary>
    /// POST /api/admin/organizer-requests/{id}/approve - Approve organizer request
    /// </summary>
    [HttpPost("organizer-requests/{id}/approve")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveOrganizerRequest(int id)
    {
        try
        {
            var adminId = GetUserIdFromClaims();
            var request = await _adminService.ApproveOrganizerRequestAsync(id, adminId);
            return Ok(ApiResponse<object>.SuccessResponse(request, "Organizer request approved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving organizer request {RequestId}", id);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// POST /api/admin/organizer-requests/{id}/reject - Reject organizer request
    /// </summary>
    [HttpPost("organizer-requests/{id}/reject")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectOrganizerRequest(int id, [FromBody] RejectRequestDto? dto = null)
    {
        try
        {
            var adminId = GetUserIdFromClaims();
            var request = await _adminService.RejectOrganizerRequestAsync(id, adminId, dto?.ReviewNotes);
            return Ok(ApiResponse<object>.SuccessResponse(request, "Organizer request rejected"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting organizer request {RequestId}", id);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    [HttpPost("test-email")]
    public async Task<IActionResult> TestEmailSending(string to, string name)
    {
        await _emailService.SendWelcomeEmailAsync(to, name);
        return Ok(new { Message = "Test welcome email sent successfully." });
    }

    /// <summary>
    /// GET /api/admin/events/pending - Get all pending events
    /// </summary>
    [HttpGet("events/pending")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingEvents()
    {
        var events = await _adminService.GetAllPendingEventsAsync();
        return Ok(ApiResponse<object>.SuccessResponse(events, $"Retrieved {events.Count} pending events"));
    }

    /// <summary>
    /// POST /api/admin/events/{id}/approve - Approve event
    /// </summary>
    [HttpPost("events/{id}/approve")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveEvent(int id)
    {
        try
        {
            var adminId = GetUserIdFromClaims();
            var eventEntity = await _adminService.ApproveEventAsync(id, adminId);
            return Ok(ApiResponse<object>.SuccessResponse(eventEntity, "Event approved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving event {EventId}", id);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// POST /api/admin/events/{id}/reject - Reject event
    /// </summary>
    [HttpPost("events/{id}/reject")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectEvent(int id, [FromBody] RejectEventDto? dto = null)
    {
        try
        {
            var adminId = GetUserIdFromClaims();
            var eventEntity = await _adminService.RejectEventAsync(id, adminId, dto?.RejectionReason);
            return Ok(ApiResponse<object>.SuccessResponse(eventEntity, "Event rejected"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting event {EventId}", id);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    private int GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("userId")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }

        return userId;
    }
}

public class RejectRequestDto
{
    public string? ReviewNotes { get; set; }
}

public class RejectEventDto
{
    public string? RejectionReason { get; set; }
}
