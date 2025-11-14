using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Event;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EventController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly ILogger<EventController> _logger;

    public EventController(
        IEventService eventService,
        ILogger<EventController> logger)
    {
        _eventService = eventService;
        _logger = logger;
    }

    #region Public Endpoints

    /// Get all events with filtering, sorting and pagination
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EventListDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<EventListDto>>>> GetEvents(
        [FromQuery] EventFilterDto filter)
    {
        _logger.LogInformation("Getting events with filters: {@Filter}", filter);

        var result = await _eventService.GetAllEventsAsync(filter);

        return Ok(ApiResponse<PagedResult<EventListDto>>.SuccessResponse(
            result,
            $"Retrieved {result.Items.Count} events (Page {result.PageNumber}/{result.TotalPages})"
        ));
    }

    /// Get featured events for homepage
    [HttpGet("featured")]
    [ProducesResponseType(typeof(ApiResponse<List<EventCardDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<EventCardDto>>>> GetFeaturedEvents(
        [FromQuery] int count = 10)
    {
        if (count > 50) count = 50; 
        if (count < 1) count = 10;

        _logger.LogInformation("Getting {Count} featured events", count);

        var events = await _eventService.GetFeaturedEventsAsync(count);

        return Ok(ApiResponse<List<EventCardDto>>.SuccessResponse(
            events,
            $"Retrieved {events.Count} featured events"
        ));
    }

    /// Get upcoming published events
    [HttpGet("upcoming")]
    [ProducesResponseType(typeof(ApiResponse<List<EventCardDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<EventCardDto>>>> GetUpcomingEvents(
        [FromQuery] int count = 20)
    {
        if (count > 100) count = 100;
        if (count < 1) count = 20;

        _logger.LogInformation("Getting {Count} upcoming events", count);

        var events = await _eventService.GetUpcomingEventsAsync(count);

        return Ok(ApiResponse<List<EventCardDto>>.SuccessResponse(
            events,
            $"Retrieved {events.Count} upcoming events"
        ));
    }

    /// Get event details by ID
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> GetEventById(int id)
    {
        _logger.LogInformation("Getting event details for ID: {EventId}", id);

        var eventDetail = await _eventService.GetEventByIdAsync(id);

        if (eventDetail == null)
        {
            return NotFound(ApiResponse<EventDetailDto>.FailureResponse(
                $"Event with ID {id} not found"
            ));
        }

        return Ok(ApiResponse<EventDetailDto>.SuccessResponse(
            eventDetail,
            "Event details retrieved successfully"
        ));
    }

    /// Search events by keyword
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EventListDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EventListDto>>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<PagedResult<EventListDto>>>> SearchEvents(
        [FromQuery] string q,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(ApiResponse<PagedResult<EventListDto>>.FailureResponse(
                "Search query cannot be empty",
                new List<string> { "Parameter 'q' is required" }
            ));
        }

        if (pageSize > 100) pageSize = 100;

        _logger.LogInformation("Searching events with query: {Query}", q);

        var result = await _eventService.SearchEventsAsync(q, pageNumber, pageSize);

        return Ok(ApiResponse<PagedResult<EventListDto>>.SuccessResponse(
            result,
            $"Found {result.TotalCount} events matching '{q}'"
        ));
    }

    #endregion

    #region Organizer Endpoints (Organizer Role Required)

    /// Create new event (Organizer only)
    [HttpPost]
    [Authorize(Roles = "Organizer")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> CreateEvent(
        [FromBody] CreateEventDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<EventDetailDto>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        var organizerId = GetOrganizerIdFromClaims();

        _logger.LogInformation("Organizer {OrganizerId} creating event: {EventTitle}",
            organizerId, dto.Title);

        var createdEvent = await _eventService.CreateEventAsync(dto, organizerId);

        return CreatedAtAction(
            nameof(GetEventById),
            new { id = createdEvent.EventId },
            ApiResponse<EventDetailDto>.SuccessResponse(
                createdEvent,
                "Event created successfully and submitted for approval"
            )
        );
    }

    /// Update existing event (Organizer/Admin)
    [HttpPut("{id}")]
    [Authorize(Roles = "Organizer,Admin")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> UpdateEvent(
        int id,
        [FromBody] UpdateEventDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<EventDetailDto>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("User {UserId} updating event {EventId}", userId, id);

        var updatedEvent = await _eventService.UpdateEventAsync(id, dto, userId, isAdmin);

        return Ok(ApiResponse<EventDetailDto>.SuccessResponse(
            updatedEvent,
            "Event updated successfully"
        ));
    }

    /// Publish event - submit for admin approval (Organizer only)
    [HttpPost("{id}/publish")]
    [Authorize(Roles = "Organizer")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> PublishEvent(int id)
    {
        var organizerId = GetOrganizerIdFromClaims();

        _logger.LogInformation("Organizer {OrganizerId} publishing event {EventId}",
            organizerId, id);

        var publishedEvent = await _eventService.PublishEventAsync(id, organizerId);

        return Ok(ApiResponse<EventDetailDto>.SuccessResponse(
            publishedEvent,
            "Event published and submitted for approval"
        ));
    }

    /// Cancel event (Organizer/Admin)
    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Organizer,Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> CancelEvent(
        int id,
        [FromBody] CancelEventRequest? request = null)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("User {UserId} cancelling event {EventId}", userId, id);

        var result = await _eventService.CancelEventAsync(
            id,
            userId,
            isAdmin,
            request?.Reason
        );

        return Ok(ApiResponse<bool>.SuccessResponse(
            result,
            "Event cancelled successfully. Refunds will be processed automatically."
        ));
    }

    /// Duplicate event (create copy with new dates)
    [HttpPost("{id}/duplicate")]
    [Authorize(Roles = "Organizer")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> DuplicateEvent(int id)
    {
        var organizerId = GetOrganizerIdFromClaims();

        _logger.LogInformation("Organizer {OrganizerId} duplicating event {EventId}",
            organizerId, id);

        var duplicatedEvent = await _eventService.DuplicateEventAsync(id, organizerId);

        return CreatedAtAction(
            nameof(GetEventById),
            new { id = duplicatedEvent.EventId },
            ApiResponse<EventDetailDto>.SuccessResponse(
                duplicatedEvent,
                "Event duplicated successfully. Please update dates and details before publishing."
            )
        );
    }

    #endregion

    #region Admin Endpoints (Admin Role Required)

    /// Approve event (Admin only)
    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> ApproveEvent(int id)
    {
        var adminId = GetUserIdFromClaims();

        _logger.LogInformation("Admin {AdminId} approving event {EventId}", adminId, id);

        var approvedEvent = await _eventService.ApproveEventAsync(id, adminId);

        return Ok(ApiResponse<EventDetailDto>.SuccessResponse(
            approvedEvent,
            "Event approved successfully and is now live"
        ));
    }

    /// Reject event (Admin only)
    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> RejectEvent(
        int id,
        [FromBody] RejectEventDto dto)
    {
        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(ApiResponse<EventDetailDto>.FailureResponse(
                "Rejection reason is required",
                new List<string> { "Please provide a reason for rejection" }
            ));
        }

        var adminId = GetUserIdFromClaims();

        _logger.LogInformation("Admin {AdminId} rejecting event {EventId} with reason: {Reason}",
            adminId, id, dto.Reason);

        var rejectedEvent = await _eventService.RejectEventAsync(id, adminId, dto.Reason);

        return Ok(ApiResponse<EventDetailDto>.SuccessResponse(
            rejectedEvent,
            "Event rejected. Organizer has been notified."
        ));
    }

    /// Delete event (Admin only) - Soft delete
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteEvent(int id)
    {
        var adminId = GetUserIdFromClaims();

        _logger.LogInformation("Admin {AdminId} deleting event {EventId}", adminId, id);

        var result = await _eventService.DeleteEventAsync(id);

        return Ok(ApiResponse<bool>.SuccessResponse(
            result,
            "Event deleted successfully"
        ));
    }

    #endregion

    #region Statistics Endpoint (Organizer/Admin)

    /// Get event statistics (Organizer/Admin)
    [HttpGet("{id}/stats")]
    [Authorize(Roles = "Organizer,Admin")]
    [ProducesResponseType(typeof(ApiResponse<EventStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventStatsDto>>> GetEventStatistics(int id)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("User {UserId} requesting statistics for event {EventId}",
            userId, id);

        var stats = await _eventService.GetEventStatisticsAsync(id, userId, isAdmin);

        return Ok(ApiResponse<EventStatsDto>.SuccessResponse(
            stats,
            "Event statistics retrieved successfully"
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

    /// Get organizer ID from JWT claims (for organizers)
    private int GetOrganizerIdFromClaims()
    {
        var organizerIdClaim = User.FindFirst("organizerId")?.Value;

        if (string.IsNullOrEmpty(organizerIdClaim) || !int.TryParse(organizerIdClaim, out var organizerId))
        {
            throw new UnauthorizedAccessException("Organizer ID not found in token. User may not be an organizer.");
        }

        return organizerId;
    }

    #endregion
}

/// Request model for cancelling events
public class CancelEventRequest
{
    public string? Reason { get; set; }
}


