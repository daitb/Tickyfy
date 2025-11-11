using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Ticket;
using Tickify.Interfaces.Services;
using Tickify.Interfaces.Repositories;
using Tickify.Services.Email;
using QRCoder;

namespace Tickify.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TicketController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly IEmailService _emailService;
    private readonly IBookingRepository _bookingRepository;

    public TicketController(
        ITicketService ticketService,
        IEmailService emailService,
        IBookingRepository bookingRepository)
    {
        _ticketService = ticketService;
        _emailService = emailService;
        _bookingRepository = bookingRepository;
    }

    /// Get ticket details by ID
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TicketDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<TicketDetailDto>>> GetTicketById(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Organizer");

        // Get user's tickets to check ownership
        var userTickets = await _ticketService.GetUserTicketsAsync(userId);
        var ticket = userTickets.FirstOrDefault(t => t.TicketId == id);

        if (ticket == null && !isAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResponse("You don't have permission to view this ticket or ticket not found."));
        }

        // If admin and ticket not found in user's tickets, try to get by ID
        if (ticket == null && isAdmin)
        {
            var ticketDto = await _ticketService.GetByIdAsync(id);
            // Convert TicketDto to TicketDetailDto (simplified - may need full details)
            return Ok(ApiResponse<TicketDto>.SuccessResponse(ticketDto));
        }

        return Ok(ApiResponse<TicketDetailDto>.SuccessResponse(ticket!));
    }

    /// Get current user's tickets
    [HttpGet("my-tickets")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TicketDetailDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<TicketDetailDto>>>> GetMyTickets(
        [FromQuery] string? status = null,
        [FromQuery] int? eventId = null)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        var tickets = await _ticketService.GetUserTicketsAsync(userId);

        // Apply filters
        if (!string.IsNullOrEmpty(status))
        {
            tickets = tickets.Where(t => t.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        if (eventId.HasValue)
        {
            tickets = tickets.Where(t => t.EventId == eventId.Value);
        }

        return Ok(ApiResponse<IEnumerable<TicketDetailDto>>.SuccessResponse(tickets));
    }

    /// Transfer ticket to another user
    [HttpPost("{id}/transfer")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<TicketDto>>> TransferTicket(
        int id,
        [FromBody] TicketTransferDto transferDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var ticket = await _ticketService.TransferTicketAsync(id, transferDto, userId);

        return Ok(ApiResponse<TicketDto>.SuccessResponse(
            ticket,
            $"Ticket transfer initiated. Waiting for recipient to accept."
        ));
    }

    /// Accept ticket transfer
    [HttpPost("transfers/{id}/accept")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<TicketDto>>> AcceptTransfer(
        int id,
        [FromBody] AcceptTransferDto acceptTransferDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var ticket = await _ticketService.AcceptTransferAsync(acceptTransferDto, userId);

        return Ok(ApiResponse<TicketDto>.SuccessResponse(
            ticket,
            "Ticket transfer accepted successfully. Ticket is now yours."
        ));
    }

    /// Reject ticket transfer
    [HttpPost("transfers/{id}/reject")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<object>>> RejectTransfer(
        int id,
        [FromBody] AcceptTransferDto rejectTransferDto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await _ticketService.RejectTransferAsync(rejectTransferDto, userId);

        return Ok(ApiResponse<object>.SuccessResponse(
            new { transferId = id, rejected = result },
            "Ticket transfer rejected successfully."
        ));
    }

    /// Get QR code for ticket
    [HttpGet("{id}/qrcode")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<object>>> GetQRCode(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Organizer");

        // Get user's tickets to check ownership
        var userTickets = await _ticketService.GetUserTicketsAsync(userId);
        var userTicket = userTickets.FirstOrDefault(t => t.TicketId == id);

        if (userTicket == null && !isAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResponse("You don't have permission to view this ticket's QR code."));
        }

        var ticket = userTicket != null 
            ? await _ticketService.GetByIdAsync(id) 
            : await _ticketService.GetByIdAsync(id);

        // Generate QR code from ticket number
        using (var qrGenerator = new QRCodeGenerator())
        {
            // Create QR code data with ticket number as the payload
            var qrCodeData = qrGenerator.CreateQrCode(ticket.TicketNumber, QRCodeGenerator.ECCLevel.Q);
            
            using (var qrCode = new PngByteQRCode(qrCodeData))
            {
                // Generate QR code as PNG byte array (10 pixels per module for good quality)
                byte[] qrCodeImage = qrCode.GetGraphic(10);
                
                // Convert to base64 for easy transmission
                string base64QrCode = Convert.ToBase64String(qrCodeImage);
                
                return Ok(ApiResponse<object>.SuccessResponse(
                    new 
                    { 
                        ticketId = id,
                        ticketNumber = ticket.TicketNumber,
                        qrCodeData = ticket.TicketNumber, // Raw data for validation
                        qrCodeImage = $"data:image/png;base64,{base64QrCode}", // Base64 encoded image
                        format = "png",
                        encoding = "base64"
                    },
                    "QR code generated successfully."
                ));
            }
        }
    }

    /// Resend ticket email
    [HttpPost("{id}/resend-email")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<object>>> ResendEmail(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Get user's tickets to check ownership
        var userTickets = await _ticketService.GetUserTicketsAsync(userId);
        var ticket = userTickets.FirstOrDefault(t => t.TicketId == id);

        if (ticket == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResponse("You don't have permission to resend email for this ticket or ticket not found."));
        }

        // Get booking to retrieve user email
        var booking = await _bookingRepository.GetByIdAsync(ticket.BookingId);
        if (booking?.User == null)
        {
            return StatusCode(StatusCodes.Status404NotFound,
                ApiResponse<object>.FailureResponse("Booking or user information not found."));
        }

        // Prepare email template data with ticket details
        var templateData = new Dictionary<string, string>
        {
            { "UserName", booking.User.FullName },
            { "EventTitle", ticket.EventTitle },
            { "EventVenue", ticket.EventVenue },
            { "EventDate", ticket.EventStartDate.ToString("MMMM dd, yyyy") },
            { "EventTime", ticket.EventStartDate.ToString("hh:mm tt") },
            { "TicketNumber", ticket.TicketNumber },
            { "TicketType", ticket.TicketTypeName },
            { "SeatNumber", ticket.SeatNumber ?? "General Admission" },
            { "Price", ticket.Price.ToString("C") },
            { "BookingNumber", ticket.BookingNumber },
            { "QRCode", ticket.QrCode ?? ticket.TicketNumber } // Use QR code or ticket number as fallback
        };

        // Send ticket email using template
        try
        {
            await _emailService.SendEmailFromTemplateAsync(
                booking.User.Email,
                $"Your Ticket for {ticket.EventTitle}",
                "ticket-confirmation", // Template name (should exist in EmailTemplates folder)
                templateData
            );
        }
        catch (Exception ex)
        {
            // Log error but don't fail the request
            // TODO: Add proper logging
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.FailureResponse($"Failed to send email: {ex.Message}"));
        }
        
        return Ok(ApiResponse<object>.SuccessResponse(
            new { ticketId = id, emailSent = true },
            "Ticket email resent successfully. Check your inbox."
        ));
    }

    /// Get all tickets for an event (Organizer/Admin only)
    [HttpGet("event/{eventId}")]
    [Authorize(Roles = "Admin,Organizer")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TicketDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<IEnumerable<TicketDto>>>> GetEventTickets(
        int eventId,
        [FromQuery] string? status = null)
    {
        var tickets = await _ticketService.GetByBookingIdAsync(eventId); // Note: Should be GetByEventIdAsync

        // Apply status filter
        if (!string.IsNullOrEmpty(status))
        {
            tickets = tickets.Where(t => t.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(ApiResponse<IEnumerable<TicketDto>>.SuccessResponse(
            tickets,
            $"Retrieved {tickets.Count()} tickets for event {eventId}."
        ));
    }
}
