using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Waitlist;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WaitlistController : ControllerBase
{
    private readonly IWaitlistService _waitlistService;
    private readonly ILogger<WaitlistController> _logger;

    public WaitlistController(IWaitlistService waitlistService, ILogger<WaitlistController> logger)
    {
        _waitlistService = waitlistService;
        _logger = logger;
    }

    private int GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }

    /// <summary>
    /// GET /api/waitlist/my - Get current user's waitlist entries
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<WaitlistDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<WaitlistDto>>>> GetMyWaitlist()
    {
        var userId = GetUserIdFromClaims();

        _logger.LogInformation("User {UserId} retrieving waitlist entries", userId);

        var entries = await _waitlistService.GetMyWaitlistEntriesAsync(userId);

        return Ok(ApiResponse<List<WaitlistDto>>.SuccessResponse(
            entries,
            "Waitlist entries retrieved successfully"
        ));
    }

    /// <summary>
    /// POST /api/waitlist/join - Join waitlist for an event
    /// </summary>
    [HttpPost("join")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<WaitlistDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<WaitlistDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<WaitlistDto>>> JoinWaitlist([FromBody] JoinWaitlistDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<WaitlistDto>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        var userId = GetUserIdFromClaims();

        _logger.LogInformation("User {UserId} joining waitlist for event {EventId}", userId, dto.EventId);

        try
        {
            var entry = await _waitlistService.JoinWaitlistAsync(userId, dto);

            return CreatedAtAction(
                nameof(GetMyWaitlist),
                null,
                ApiResponse<WaitlistDto>.SuccessResponse(
                    entry,
                    "Successfully joined waitlist"
                )
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining waitlist for user {UserId}, event {EventId}", userId, dto.EventId);
            return BadRequest(ApiResponse<WaitlistDto>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// DELETE /api/waitlist/{id} - Leave/remove from waitlist
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> LeaveWaitlist(int id)
    {
        var userId = GetUserIdFromClaims();

        _logger.LogInformation("User {UserId} leaving waitlist entry {WaitlistId}", userId, id);

        try
        {
            await _waitlistService.LeaveWaitlistAsync(userId, id);

            return Ok(ApiResponse<object>.SuccessResponse(
                new { },
                "Successfully left waitlist"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving waitlist for user {UserId}, waitlist {WaitlistId}", userId, id);
            
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(ex.Message));
            }

            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// GET /api/waitlist/check/{eventId} - Check if user is on waitlist for an event
    /// </summary>
    [HttpGet("check/{eventId}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<bool>>> CheckWaitlist(int eventId, [FromQuery] int? ticketTypeId = null)
    {
        var userId = GetUserIdFromClaims();

        _logger.LogInformation("User {UserId} checking waitlist status for event {EventId}", userId, eventId);

        var isOnWaitlist = await _waitlistService.IsUserOnWaitlistAsync(userId, eventId, ticketTypeId);

        return Ok(ApiResponse<bool>.SuccessResponse(
            isOnWaitlist,
            isOnWaitlist ? "User is on waitlist" : "User is not on waitlist"
        ));
    }
}
