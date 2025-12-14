using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Tickify.Common;
using Tickify.Data;
using Tickify.DTOs.Event;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Route("api/events")]
[Produces("application/json")]
public class EventController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly ILogger<EventController> _logger;
    private readonly ApplicationDbContext _context;

    public EventController(
        IEventService eventService,
        ILogger<EventController> logger,
        ApplicationDbContext context)
    {
        _eventService = eventService;
        _logger = logger;
        _context = context;
    }

    #region Public Endpoints

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

    [HttpGet("trending")]
    [ProducesResponseType(typeof(ApiResponse<List<EventCardDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<EventCardDto>>>> GetTrendingEvents(
        [FromQuery] int count = 10)
    {
        if (count > 50) count = 50;
        if (count < 1) count = 10;

        _logger.LogInformation("Getting {Count} trending events", count);

        var events = await _eventService.GetTrendingEventsAsync(count);

        return Ok(ApiResponse<List<EventCardDto>>.SuccessResponse(
            events,
            $"Retrieved {events.Count} trending events"
        ));
    }

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

    [HttpPost]
    [Authorize(Roles = "Organizer")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> CreateEvent(
        [FromBody] CreateEventDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                _logger.LogWarning("CreateEvent validation failed: {Errors}", string.Join(", ", errors));

                return BadRequest(ApiResponse<EventDetailDto>.FailureResponse(
                    "Validation failed",
                    errors
                ));
            }

            var organizerId = await GetOrganizerIdFromClaimsAsync();

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating event: {Message}. DTO: {@Dto}", ex.Message, dto);
            throw;
        }
    }

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

    [HttpPost("{id}/publish")]
    [Authorize(Roles = "Organizer")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> PublishEvent(int id)
    {
        var organizerId = await GetOrganizerIdFromClaimsAsync();

        _logger.LogInformation("Organizer {OrganizerId} publishing event {EventId}",
            organizerId, id);

        var publishedEvent = await _eventService.PublishEventAsync(id, organizerId);

        return Ok(ApiResponse<EventDetailDto>.SuccessResponse(
            publishedEvent,
            "Event published and submitted for approval"
        ));
    }

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

    [HttpPost("{id}/duplicate")]
    [Authorize(Roles = "Organizer")]
    [ProducesResponseType(typeof(ApiResponse<EventDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> DuplicateEvent(int id)
    {
        var organizerId = await GetOrganizerIdFromClaimsAsync();

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
        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(dto.RejectionReason))
        {
            return BadRequest(ApiResponse<EventDetailDto>.FailureResponse(
                "Rejection reason is required",
                new List<string> { "Please provide a reason for rejection" }
            ));
        }

        var adminId = GetUserIdFromClaims();

        _logger.LogInformation("Admin {AdminId} rejecting event {EventId} with reason: {Reason}",
            adminId, id, dto.RejectionReason);

        var rejectedEvent = await _eventService.RejectEventAsync(id, adminId, dto.RejectionReason);

        return Ok(ApiResponse<EventDetailDto>.SuccessResponse(
            rejectedEvent,
            "Event rejected. Organizer has been notified."
        ));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Organizer,Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteEvent(int id)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("User {UserId} deleting event {EventId}", userId, id);

        var result = await _eventService.DeleteEventAsync(id, userId, isAdmin);

        return Ok(ApiResponse<bool>.SuccessResponse(
            result,
            "Event deleted successfully"
        ));
    }

    #endregion

    #region Statistics Endpoint (Organizer/Admin)

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

    private async Task<int> GetOrganizerIdFromClaimsAsync()
    {
        var allClaims = User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
        _logger.LogInformation("User claims: {Claims}", string.Join(", ", allClaims));

        var organizerIdClaim = User.FindFirst("organizerId")?.Value;

        if (string.IsNullOrEmpty(organizerIdClaim))
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token.");
            }

            _logger.LogWarning("organizerId not found in token, fetching from database for userId {UserId}", userId);

            var organizer = await _context.Organizers
                .FirstOrDefaultAsync(o => o.UserId == userId);

            if (organizer == null)
            {
                var user = await _context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    throw new UnauthorizedAccessException($"User {userId} not found.");
                }

                var hasOrganizerRole = user.UserRoles?.Any(ur => ur.Role.Name == "Organizer") ?? false;

                if (!hasOrganizerRole)
                {
                    _logger.LogWarning("User {UserId} has Organizer role in token but not in database. This may indicate a token issue.", userId);
                    throw new UnauthorizedAccessException("You do not have organizer permissions. Please contact admin if you believe this is an error.");
                }

                var approvedRequest = await _context.OrganizerRequests
                    .FirstOrDefaultAsync(r => r.UserId == userId && r.Status == "Approved");

                if (approvedRequest == null)
                {
                    _logger.LogWarning("User {UserId} has Organizer role in database but no approved organizer request. This may indicate a data inconsistency.", userId);
                    throw new UnauthorizedAccessException("You do not have a valid organizer profile. Please contact admin if you believe this is an error.");
                }

                _logger.LogInformation("Auto-creating Organizer profile for user {UserId} from approved request {RequestId}", userId, approvedRequest.RequestId);

                organizer = new Tickify.Models.Organizer
                {
                    UserId = userId,
                    CompanyName = approvedRequest.OrganizationName,
                    BusinessRegistrationNumber = approvedRequest.BusinessRegistration,
                    CompanyAddress = approvedRequest.Address,
                    CompanyPhone = approvedRequest.PhoneNumber,
                    Description = approvedRequest.Description ?? "New organizer profile - please update your information",
                    IsVerified = true,
                    VerifiedAt = approvedRequest.ReviewedAt ?? DateTime.UtcNow,
                    VerifiedByStaffId = approvedRequest.ReviewedByAdminId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Organizers.Add(organizer);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created organizer {OrganizerId} for user {UserId} from approved request", organizer.Id, userId);
            }
            else
            {
                _logger.LogInformation("Found organizer {OrganizerId} for user {UserId}", organizer.Id, userId);
            }

            return organizer.Id;
        }

        if (!int.TryParse(organizerIdClaim, out var organizerId))
        {
            throw new UnauthorizedAccessException("Invalid organizerId format in token.");
        }

        return organizerId;
    }

    #endregion
}

public class CancelEventRequest
{
    public string? Reason { get; set; }
}


