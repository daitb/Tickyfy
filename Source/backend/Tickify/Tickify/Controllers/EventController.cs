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

}