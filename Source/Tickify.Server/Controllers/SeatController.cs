using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Common;
using Tickify.DTOs.Seat;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

/// <summary>
/// Developer 3 - Seat Management APIs
/// Week 2 - 5 endpoints for seat operations
/// </summary>
[ApiController]
[Route("api/seats")]
public class SeatController : ControllerBase
{
    private readonly ISeatService _seatService;
    private readonly ILogger<SeatController> _logger;

    public SeatController(ISeatService seatService, ILogger<SeatController> logger)
    {
        _seatService = seatService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/seats/event/{eventId} - Get seat map for event
    /// Public endpoint - anyone can view available seats
    /// </summary>
    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<SeatDto>>>> GetSeatsByEvent(int eventId)
    {
        try
        {
            var seats = await _seatService.GetByEventIdAsync(eventId);
            return Ok(ApiResponse<IEnumerable<SeatDto>>.SuccessResponse(
                seats, 
                "Seats retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting seats for event {EventId}", eventId);
            return StatusCode(500, ApiResponse<IEnumerable<SeatDto>>.FailureResponse(
                "An error occurred while retrieving seats"));
        }
    }

    /// <summary>
    /// GET /api/seats/ticket-type/{ticketTypeId} - Get available seats by ticket type
    /// Public endpoint - returns seat availability info
    /// </summary>
    [HttpGet("ticket-type/{ticketTypeId}")]
    public async Task<ActionResult<ApiResponse<SeatAvailabilityDto>>> GetAvailableSeatsByTicketType(int ticketTypeId)
    {
        try
        {
            var availability = await _seatService.GetSeatAvailabilityAsync(ticketTypeId);
            return Ok(ApiResponse<SeatAvailabilityDto>.SuccessResponse(
                availability, 
                "Seat availability retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting seat availability for ticket type {TicketTypeId}", ticketTypeId);
            return StatusCode(500, ApiResponse<SeatAvailabilityDto>.FailureResponse(
                "An error occurred while retrieving seat availability"));
        }
    }

    /// <summary>
    /// POST /api/seats/bulk-create - Create multiple seats at once (Organizer only)
    /// Used when setting up event seating layout
    /// </summary>
    [HttpPost("bulk-create")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<ActionResult<ApiResponse<IEnumerable<SeatDto>>>> BulkCreateSeats([FromBody] BulkCreateSeatDto bulkCreateDto)
    {
        try
        {
            var seats = await _seatService.CreateBulkSeatsAsync(bulkCreateDto);
            return Ok(ApiResponse<IEnumerable<SeatDto>>.SuccessResponse(
                seats, 
                $"{seats.Count()} seats created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk creating seats");
            return BadRequest(ApiResponse<IEnumerable<SeatDto>>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// PUT /api/seats/{id}/block - Block a seat (Admin only)
    /// Prevents seat from being booked (maintenance, damage, etc.)
    /// </summary>
    [HttpPut("{id}/block")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SeatDto>>> BlockSeat(int id, [FromBody] BlockSeatDto blockDto)
    {
        try
        {
            var seat = await _seatService.BlockSeatAsync(id, blockDto);
            return Ok(ApiResponse<SeatDto>.SuccessResponse(
                seat, 
                $"Seat {seat.FullSeatCode} blocked successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error blocking seat {SeatId}", id);
            return BadRequest(ApiResponse<SeatDto>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// PUT /api/seats/{id}/unblock - Unblock a seat (Admin only)
    /// Makes seat available for booking again
    /// </summary>
    [HttpPut("{id}/unblock")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SeatDto>>> UnblockSeat(int id)
    {
        try
        {
            var seat = await _seatService.UnblockSeatAsync(id);
            return Ok(ApiResponse<SeatDto>.SuccessResponse(
                seat, 
                $"Seat {seat.FullSeatCode} unblocked successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unblocking seat {SeatId}", id);
            return BadRequest(ApiResponse<SeatDto>.FailureResponse(ex.Message));
        }
    }

    // ============================================
    // BONUS: Additional helpful endpoints
    // ============================================

    /// <summary>
    /// GET /api/seats/{id} - Get single seat details
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SeatDto>>> GetSeatById(int id)
    {
        try
        {
            var seat = await _seatService.GetByIdAsync(id);
            if (seat == null)
                return NotFound(ApiResponse<SeatDto>.FailureResponse("Seat not found"));

            return Ok(ApiResponse<SeatDto>.SuccessResponse(seat, "Seat retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting seat {SeatId}", id);
            return StatusCode(500, ApiResponse<SeatDto>.FailureResponse(
                "An error occurred while retrieving seat"));
        }
    }

    /// <summary>
    /// POST /api/seats/check-availability - Check if specific seats are available
    /// Used during checkout to validate seat selection
    /// </summary>
    [HttpPost("check-availability")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckSeatAvailability([FromBody] List<int> seatIds)
    {
        try
        {
            var available = await _seatService.AreSeatAvailableAsync(seatIds);
            return Ok(ApiResponse<bool>.SuccessResponse(
                available, 
                available ? "All seats are available" : "One or more seats are not available"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking seat availability");
            return StatusCode(500, ApiResponse<bool>.FailureResponse(
                "An error occurred while checking availability"));
        }
    }
}

