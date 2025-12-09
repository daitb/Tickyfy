using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Organizer;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

/// Organizer Controller - Manages event organizers
[ApiController]
[Route("api/organizers")]
[Produces("application/json")]
public class OrganizerController : ControllerBase
{
    private readonly IOrganizerService _organizerService;
    private readonly ILogger<OrganizerController> _logger;

    public OrganizerController(
        IOrganizerService organizerService,
        ILogger<OrganizerController> logger)
    {
        _organizerService = organizerService;
        _logger = logger;
    }

    #region Public/User Endpoints

    /// POST /api/organizers/register - Register as organizer (Authenticated users) - Now creates a request
    [HttpPost("register")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object>>> RegisterOrganizer(
        [FromBody] CreateOrganizerDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<object>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        var userId = GetUserIdFromClaims();

        _logger.LogInformation("User {UserId} submitting organizer request", userId);

        try
        {
            // Check if user already has a pending request
            var existingRequest = await _organizerService.GetPendingOrganizerRequestAsync(userId);
            if (existingRequest != null)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(
                    "You already have a pending organizer request. Please wait for admin approval."
                ));
            }

            // Check if user is already an organizer
            var existingOrganizer = await _organizerService.GetOrganizerByUserIdAsync(userId);
            if (existingOrganizer != null)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(
                    "You are already registered as an organizer."
                ));
            }

            // Create organizer request instead of directly creating organizer
            var request = await _organizerService.CreateOrganizerRequestAsync(userId, dto);

            return CreatedAtAction(
                nameof(GetOrganizerProfile),
                new { id = 0 },
                ApiResponse<object>.SuccessResponse(
                    request,
                    "Your organizer application has been submitted successfully. Please wait for admin approval."
                )
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating organizer request for user {UserId}", userId);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    /// GET /api/organizers/{id} - Get organizer profile by ID (Public)
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<OrganizerProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrganizerProfileDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<OrganizerProfileDto>>> GetOrganizerProfile(int id)
    {
        _logger.LogInformation("Fetching organizer profile for ID: {OrganizerId}", id);

        var organizer = await _organizerService.GetOrganizerProfileAsync(id);

        if (organizer == null)
        {
            return NotFound(ApiResponse<OrganizerProfileDto>.FailureResponse(
                $"Organizer with ID {id} not found"
            ));
        }

        return Ok(ApiResponse<OrganizerProfileDto>.SuccessResponse(
            organizer,
            "Organizer profile retrieved successfully"
        ));
    }

    /// PUT /api/organizers/{id} - Update organizer profile (Organizer only)
    [HttpPut("{id}")]
    [Authorize(Roles = "Organizer")]
    [ProducesResponseType(typeof(ApiResponse<OrganizerProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrganizerProfileDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<OrganizerProfileDto>>> UpdateOrganizerProfile(
        int id,
        [FromBody] CreateOrganizerDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<OrganizerProfileDto>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        var userId = GetUserIdFromClaims();

        _logger.LogInformation("User {UserId} updating organizer profile {OrganizerId}", userId, id);

        var updatedOrganizer = await _organizerService.UpdateOrganizerProfileAsync(id, userId, dto);

        return Ok(ApiResponse<OrganizerProfileDto>.SuccessResponse(
            updatedOrganizer,
            "Organizer profile updated successfully"
        ));
    }

    /// GET /api/organizers/my-request - Get current user's pending organizer request
    [HttpGet("my-request")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object>>> GetMyOrganizerRequest()
    {
        var userId = GetUserIdFromClaims();

        _logger.LogInformation("User {UserId} checking for pending organizer request", userId);

        var request = await _organizerService.GetPendingOrganizerRequestAsync(userId);

        if (request == null)
        {
            return Ok(ApiResponse<object>.SuccessResponse(
                null!,
                "No pending organizer request found"
            ));
        }

        return Ok(ApiResponse<object>.SuccessResponse(
            request,
            "Pending organizer request found"
        ));
    }

    #endregion

    #region Organizer Dashboard Endpoints

    /// GET /api/organizers/{id}/events - Get organizer's events (Organizer only)
    [HttpGet("{id}/events")]
    [Authorize(Roles = "Organizer,Admin")]
    [ProducesResponseType(typeof(ApiResponse<List<OrganizerEventDashboardDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<List<OrganizerEventDashboardDto>>>> GetOrganizerEvents(int id)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Fetching events for organizer ID: {OrganizerId}", id);

        // Admin can view any organizer's events
        var events = isAdmin
            ? await _organizerService.GetOrganizerEventsAsync(id, 0) // Admin bypass userId check
            : await _organizerService.GetOrganizerEventsAsync(id, userId);

        return Ok(ApiResponse<List<OrganizerEventDashboardDto>>.SuccessResponse(
            events,
            $"Retrieved {events.Count} events"
        ));
    }

    /// GET /api/organizers/{id}/earnings - Get organizer earnings dashboard (Organizer only)
    [HttpGet("{id}/earnings")]
    [Authorize(Roles = "Organizer,Admin")]
    [ProducesResponseType(typeof(ApiResponse<OrganizerEarningsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<OrganizerEarningsDto>>> GetOrganizerEarnings(int id)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Fetching earnings for organizer ID: {OrganizerId}", id);

        // Admin can view any organizer's earnings
        var earnings = isAdmin
            ? await _organizerService.GetOrganizerEarningsAsync(id, 0)
            : await _organizerService.GetOrganizerEarningsAsync(id, userId);

        return Ok(ApiResponse<OrganizerEarningsDto>.SuccessResponse(
            earnings,
            "Organizer earnings retrieved successfully"
        ));
    }

    /// GET /api/organizers/{id}/bookings - Get organizer bookings (Organizer only)
    [HttpGet("{id}/bookings")]
    [Authorize(Roles = "Organizer,Admin")]
    [ProducesResponseType(typeof(ApiResponse<List<OrganizerBookingDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<List<OrganizerBookingDto>>>> GetOrganizerBookings(int id)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Fetching bookings for organizer ID: {OrganizerId}", id);

        // Admin can view any organizer's bookings
        var bookings = isAdmin
            ? await _organizerService.GetOrganizerBookingsAsync(id, 0)
            : await _organizerService.GetOrganizerBookingsAsync(id, userId);

        return Ok(ApiResponse<List<OrganizerBookingDto>>.SuccessResponse(
            bookings,
            $"Retrieved {bookings.Count} bookings"
        ));
    }

    #endregion

    #region Admin Endpoints

    /// POST /api/organizers/{id}/verify - Verify organizer (Admin only)
    [HttpPost("{id}/verify")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<OrganizerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OrganizerDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<OrganizerDto>>> VerifyOrganizer(int id)
    {
        var adminId = GetUserIdFromClaims();

        _logger.LogInformation("Admin {AdminId} verifying organizer {OrganizerId}", adminId, id);

        var organizer = await _organizerService.VerifyOrganizerAsync(id, adminId);

        return Ok(ApiResponse<OrganizerDto>.SuccessResponse(
            organizer,
            "Organizer verified successfully"
        ));
    }

    /// GET /api/organizers - List all organizers (Admin only)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<List<OrganizerDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<List<OrganizerDto>>>> GetAllOrganizers()
    {
        _logger.LogInformation("Fetching all organizers");

        var organizers = await _organizerService.GetAllOrganizersAsync();

        return Ok(ApiResponse<List<OrganizerDto>>.SuccessResponse(
            organizers,
            $"Retrieved {organizers.Count} organizers"
        ));
    }

    #endregion

    #region Helper Methods

    /// Get current user ID from JWT claims
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

    #endregion
}
