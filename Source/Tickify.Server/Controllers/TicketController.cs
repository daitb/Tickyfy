using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Ticket;
using Tickify.Interfaces.Services;
using Tickify.Interfaces.Repositories;
using Tickify.Services.Email;
using Tickify.Models;
using QRCoder;

namespace Tickify.Controllers;

[Route("api/tickets")]
[ApiController]
[Authorize]
public class TicketController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly IEmailService _emailService;
    private readonly IBookingRepository _bookingRepository;
    private readonly ILogger<TicketController> _logger;

    public TicketController(
        ITicketService ticketService,
        IEmailService emailService,
        IBookingRepository bookingRepository,
        ILogger<TicketController> logger)
    {
        _ticketService = ticketService;
        _emailService = emailService;
        _bookingRepository = bookingRepository;
        _logger = logger;
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
    [AllowAnonymous] // Allow testing without authentication
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TicketDetailDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<TicketDetailDto>>>> GetMyTickets(
        [FromQuery] string? status = null,
        [FromQuery] int? eventId = null)
    {
        // Return empty list if not authenticated (for development/testing)
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Ok(ApiResponse<IEnumerable<TicketDetailDto>>.SuccessResponse(
                new List<TicketDetailDto>(),
                "No tickets found (user not authenticated)"
            ));
        }

        var userId = int.Parse(userIdClaim);
        
        var tickets = await _ticketService.GetUserTicketsAsync(userId);

        // Validate and apply status filter
        if (!string.IsNullOrEmpty(status))
        {
            // Validate status is a valid TicketStatus enum value
            if (!Enum.TryParse<TicketStatus>(status, true, out var ticketStatus))
            {
                var validStatuses = string.Join(", ", Enum.GetNames(typeof(TicketStatus)));
                return BadRequest(ApiResponse<object>.FailureResponse(
                    $"Invalid status value. Valid values are: {validStatuses}"
                ));
            }
            tickets = tickets.Where(t => t.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        // Apply eventId filter
        if (eventId.HasValue)
        {
            if (eventId.Value <= 0)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(
                    "EventId must be a positive number"
                ));
            }
            tickets = tickets.Where(t => t.EventId == eventId.Value);
        }

        return Ok(ApiResponse<IEnumerable<TicketDetailDto>>.SuccessResponse(
            tickets,
            tickets.Any() 
                ? $"Found {tickets.Count()} ticket(s)" 
                : "No tickets found matching the criteria"
        ));
    }

    /// Get ticket statistics for current user
    [HttpGet("my-tickets/stats")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetMyTicketsStats()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Ok(ApiResponse<object>.SuccessResponse(
                new { totalTickets = 0 },
                "User not authenticated"
            ));
        }

        var userId = int.Parse(userIdClaim);
        var totalTickets = await _ticketService.GetUserTicketsCountAsync(userId);
        var tickets = await _ticketService.GetUserTicketsAsync(userId);
        
        var stats = new
        {
            totalTickets = totalTickets,
            validTickets = tickets.Count(t => t.Status.Equals("Valid", StringComparison.OrdinalIgnoreCase)),
            usedTickets = tickets.Count(t => t.Status.Equals("Used", StringComparison.OrdinalIgnoreCase)),
            cancelledTickets = tickets.Count(t => t.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        };

        return Ok(ApiResponse<object>.SuccessResponse(
            stats,
            $"You have {totalTickets} ticket(s) in total"
        ));
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

    /// Accept ticket transfer (via POST with body)
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
            $"Ticket transfer accepted successfully! Ticket {ticket.TicketNumber} is now yours. Check your email for confirmation."
        ));
    }

    /// Accept ticket transfer (via GET with query params - for email links)
    [HttpGet("transfers/accept")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<TicketDto>>> AcceptTransferByToken(
        [FromQuery] int transferId,
        [FromQuery] string token)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("Please login to accept the transfer"));
        }

        var userId = int.Parse(userIdClaim);
        var acceptTransferDto = new AcceptTransferDto
        {
            TransferId = transferId,
            AcceptanceToken = token
        };

        var ticket = await _ticketService.AcceptTransferAsync(acceptTransferDto, userId);

        return Ok(ApiResponse<TicketDto>.SuccessResponse(
            ticket,
            $"Ticket transfer accepted successfully! Ticket {ticket.TicketNumber} is now yours. Check your email for confirmation."
        ));
    }

    /// Get pending ticket transfers for current user
    [HttpGet("transfers/pending")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TicketTransferResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<TicketTransferResponseDto>>>> GetPendingTransfers()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        var transfers = await _ticketService.GetPendingTransfersAsync(userId);
        
        return Ok(ApiResponse<IEnumerable<TicketTransferResponseDto>>.SuccessResponse(
            transfers,
            $"Found {transfers.Count()} pending transfer(s)."
        ));
    }

    /// Reject ticket transfer (via GET with query params - for email links)
    [HttpGet("transfers/reject")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<object>>> RejectTransferByToken(
        [FromQuery] int transferId,
        [FromQuery] string token)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("Please login to reject the transfer"));
        }

        var userId = int.Parse(userIdClaim);
        var rejectTransferDto = new AcceptTransferDto
        {
            TransferId = transferId,
            AcceptanceToken = token
        };

        var result = await _ticketService.RejectTransferAsync(rejectTransferDto, userId);

        return Ok(ApiResponse<object>.SuccessResponse(
            new { 
                transferId = transferId, 
                rejected = result,
                message = "Transfer has been rejected. The sender has been notified."
            },
            "Ticket transfer rejected successfully. The sender has been notified via email."
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
            new { 
                transferId = id, 
                rejected = result,
                message = "Transfer has been rejected. The sender has been notified."
            },
            "Ticket transfer rejected successfully. The sender has been notified via email."
        ));
    }

    /// <summary>
    /// Get QR code for ticket
    /// </summary>
    [HttpGet("{id}/qrcode")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<object>>> GetQRCode(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Organizer");

        _logger.LogInformation(
            "User requesting QR code. TicketId: {TicketId}, UserId: {UserId}, IsAdmin: {IsAdmin}",
            id, userId, isAdmin);

        // Get user's tickets to check ownership
        var userTickets = await _ticketService.GetUserTicketsAsync(userId);
        var userTicket = userTickets.FirstOrDefault(t => t.TicketId == id);

        if (userTicket == null && !isAdmin)
        {
            _logger.LogWarning(
                "Unauthorized QR code access attempt. TicketId: {TicketId}, UserId: {UserId}",
                id, userId);

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

                _logger.LogInformation(
                    "QR code generated successfully. TicketId: {TicketId}, TicketNumber: {TicketNumber}",
                    id, ticket.TicketNumber);
                
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
            _logger.LogInformation(
                "Attempting to resend ticket email. TicketId: {TicketId}, UserId: {UserId}, Email: {Email}",
                id, userId, booking.User.Email);

            await _emailService.SendEmailFromTemplateAsync(
                booking.User.Email,
                $"Your Ticket for {ticket.EventTitle}",
                "ticket-confirmation", // Template name (should exist in EmailTemplates folder)
                templateData
            );

            _logger.LogInformation(
                "Successfully sent ticket email. TicketId: {TicketId}, Email: {Email}",
                id, booking.User.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send ticket email. TicketId: {TicketId}, UserId: {UserId}, Email: {Email}, Error: {ErrorMessage}",
                id, userId, booking.User.Email, ex.Message);

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
