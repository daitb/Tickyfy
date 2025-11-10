using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Booking;
using Tickify.DTOs.PromoCode;
using Tickify.DTOs.Ticket;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ITicketService _ticketService;
    private readonly IPromoCodeService _promoCodeService;

    public BookingController(
        IBookingService bookingService,
        ITicketService ticketService,
        IPromoCodeService promoCodeService)
    {
        _bookingService = bookingService;
        _ticketService = ticketService;
        _promoCodeService = promoCodeService;
    }

    /// <summary>
    /// Create a new booking with transaction locking to prevent race conditions
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BookingConfirmationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<BookingConfirmationDto>>> CreateBooking(
        [FromBody] CreateBookingDto createBookingDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        // Create booking with transaction locking (IsolationLevel.Serializable)
        var booking = await _bookingService.CreateBookingAsync(createBookingDto, userId);
        
        return Ok(ApiResponse<BookingConfirmationDto>.SuccessResponse(
            booking,
            "Booking created successfully. Payment must be completed within 15 minutes."
        ));
    }

    /// <summary>
    /// Get booking details by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<BookingDetailDto>>> GetBookingById(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Organizer");

        var booking = await _bookingService.GetBookingDetailsAsync(id, userId);
        
        // Check ownership (users can only see their own bookings, admins can see all)
        if (!isAdmin && booking.UserId != userId)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResponse("You don't have permission to view this booking."));
        }

        return Ok(ApiResponse<BookingDetailDto>.SuccessResponse(booking));
    }

    /// <summary>
    /// Get current user's bookings
    /// </summary>
    [HttpGet("my-bookings")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<BookingListDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<BookingListDto>>>> GetMyBookings(
        [FromQuery] string? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        var bookings = await _bookingService.GetByUserIdAsync(userId);

        // Apply filters
        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<BookingStatus>(status, true, out var bookingStatus))
            {
                bookings = bookings.Where(b => b.Status == bookingStatus.ToString());
            }
        }

        if (fromDate.HasValue)
        {
            bookings = bookings.Where(b => b.BookingDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            bookings = bookings.Where(b => b.BookingDate <= toDate.Value);
        }

        return Ok(ApiResponse<IEnumerable<BookingListDto>>.SuccessResponse(bookings));
    }

    /// <summary>
    /// Cancel a booking and release seats
    /// </summary>
    [HttpPost("{id}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<BookingDto>>> CancelBooking(
        int id,
        [FromBody] CancelBookingDto cancelBookingDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Organizer");

        // Check ownership
        var booking = await _bookingService.GetByIdAsync(id);
        if (!isAdmin && booking.UserId != userId)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResponse("You don't have permission to cancel this booking."));
        }

        var cancelledBooking = await _bookingService.CancelBookingAsync(id, cancelBookingDto, userId);

        return Ok(ApiResponse<BookingDto>.SuccessResponse(
            cancelledBooking,
            "Booking cancelled successfully. Seats have been released."
        ));
    }

    /// <summary>
    /// Get tickets for a confirmed booking
    /// </summary>
    [HttpGet("{id}/tickets")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TicketDetailDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<IEnumerable<TicketDetailDto>>>> GetBookingTickets(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Organizer");

        // Check ownership
        var booking = await _bookingService.GetByIdAsync(id);
        if (!isAdmin && booking.UserId != userId)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResponse("You don't have permission to view these tickets."));
        }

        // Only confirmed bookings have tickets
        if (booking.Status != BookingStatus.Confirmed.ToString())
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                "Tickets are only available for confirmed bookings."
            ));
        }

        // Get tickets using TicketService
        var tickets = await _ticketService.GetUserTicketsAsync(userId);
        var bookingTickets = tickets.Where(t => t.BookingId == id);

        return Ok(ApiResponse<IEnumerable<TicketDetailDto>>.SuccessResponse(bookingTickets));
    }

    /// <summary>
    /// Apply promo code to a pending booking
    /// NOTE: Promo code validation requires ticket type and total amount.
    /// This is a simplified validation endpoint. Full implementation requires 
    /// enhancing BookingDetailDto or adding method to BookingService.
    /// </summary>
    [HttpPut("{id}/apply-promo")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<object>>> ApplyPromoCode(
        int id,
        [FromBody] ValidatePromoCodeDto promoCodeDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Check ownership
        var booking = await _bookingService.GetByIdAsync(id);
        if (booking.UserId != userId)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResponse("You don't have permission to modify this booking."));
        }

        // Only pending bookings can apply promo codes
        if (booking.Status != BookingStatus.Pending.ToString())
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                "Promo codes can only be applied to pending bookings."
            ));
        }

        // TODO: Implement full promo code validation and application
        // Current limitation: BookingDetailDto doesn't include TicketTypeId
        // Required enhancement: Add TicketTypeId to DTO or create dedicated service method
        
        return Ok(ApiResponse<object>.SuccessResponse(
            new { 
                bookingId = id, 
                promoCode = promoCodeDto.Code,
                message = "Promo code endpoint ready. Full validation logic requires service enhancement."
            },
            $"Promo code '{promoCodeDto.Code}' - validation pending service implementation."
        ));
    }
}
