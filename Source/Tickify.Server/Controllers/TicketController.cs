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
            // For admin, get detailed ticket info directly
            var allUserTickets = await _ticketService.GetUserTicketsAsync(userId);
            var adminTicket = allUserTickets.FirstOrDefault(t => t.TicketId == id);
            
            if (adminTicket == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("Ticket not found"));
            }
            
            return Ok(ApiResponse<TicketDetailDto>.SuccessResponse(adminTicket));
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
    [AllowAnonymous]
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


    /// Get QR code for ticket
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

    /// Download ticket as PDF
    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadTicket(int id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(ApiResponse<object>.FailureResponse("Please login to download ticket."));
            }

            var userId = int.Parse(userIdClaim);
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("Organizer");

            // Get user's tickets to check ownership
            var userTickets = await _ticketService.GetUserTicketsAsync(userId);
            var ticket = userTickets.FirstOrDefault(t => t.TicketId == id);

            if (ticket == null && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<object>.FailureResponse("You don't have permission to download this ticket."));
            }

            if (ticket == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("Ticket not found"));
            }

        // Generate QR code
        string qrCodeBase64;
        using (var qrGenerator = new QRCodeGenerator())
        {
            var qrCodeData = qrGenerator.CreateQrCode(ticket.QrCode ?? ticket.TicketNumber, QRCodeGenerator.ECCLevel.Q);
            using (var qrCode = new PngByteQRCode(qrCodeData))
            {
                byte[] qrCodeImage = qrCode.GetGraphic(10);
                qrCodeBase64 = Convert.ToBase64String(qrCodeImage);
            }
        }

            // Generate HTML ticket
            var html = GenerateTicketHtml(ticket, qrCodeBase64);
            var bytes = System.Text.Encoding.UTF8.GetBytes(html);

            return File(bytes, "text/html", $"ticket-{ticket.TicketNumber}.html");
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.FailureResponse($"Error generating ticket: {ex.Message}"));
        }
    }

    private string GenerateTicketHtml(TicketDetailDto ticket, string qrCodeBase64)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Ticket - {ticket.TicketNumber}</title>
    <style>
        @media print {{
            body {{ margin: 0; padding: 20px; }}
            .no-print {{ display: none; }}
        }}
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .ticket {{
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .header {{
            background: #14b8a6;
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }}
        .header h1 {{ margin: 0 0 10px 0; font-size: 28px; }}
        .header p {{ margin: 5px 0; opacity: 0.9; }}
        .qr-section {{
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 30px 0;
        }}
        .qr-code {{
            background: white;
            padding: 20px;
            display: inline-block;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
        }}
        .info-item {{
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
        }}
        .info-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }}
        .info-value {{
            font-size: 16px;
            font-weight: 600;
            color: #333;
        }}
        .warning {{
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #666;
            font-size: 14px;
        }}
        .print-btn {{
            background: #14b8a6;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
        }}
        .print-btn:hover {{ background: #0d9488; }}
    </style>
</head>
<body>
    <div class='ticket'>
        <button class='print-btn no-print' onclick='window.print()'>🖨️ Print Ticket</button>
        
        <div class='header'>
            <h1>{ticket.EventTitle}</h1>
            <p> {ticket.EventStartDate:dddd, MMMM dd, yyyy} at {ticket.EventStartDate:hh:mm tt}</p>
            <p> {ticket.EventVenue}</p>
        </div>

        <div class='info-grid'>
            <div class='info-item'>
                <div class='info-label'>Ticket Holder</div>
                <div class='info-value'>{User.FindFirstValue(ClaimTypes.Email) ?? "Guest"}</div>
            </div>
            <div class='info-item'>
                <div class='info-label'>Ticket Type</div>
                <div class='info-value'>{ticket.TicketTypeName}</div>
            </div>
            <div class='info-item'>
                <div class='info-label'>Ticket Number</div>
                <div class='info-value'>{ticket.TicketNumber}</div>
            </div>
            <div class='info-item'>
                <div class='info-label'>Booking Number</div>
                <div class='info-value'>#{ticket.BookingNumber}</div>
            </div>
            <div class='info-item'>
                <div class='info-label'>Seat</div>
                <div class='info-value'>{ticket.SeatNumber ?? "General Admission"}</div>
            </div>
            <div class='info-item'>
                <div class='info-label'>Price Paid</div>
                <div class='info-value'>{ticket.Price:N0} ₫</div>
            </div>
            <div class='info-item'>
                <div class='info-label'>Status</div>
                <div class='info-value'>{ticket.Status}</div>
            </div>
            <div class='info-item'>
                <div class='info-label'>Purchase Date</div>
                <div class='info-value'>{ticket.CreatedAt:MMM dd, yyyy}</div>
            </div>
        </div>

        <div class='qr-section'>
            <h3 style='margin-top: 0;'>Entry QR Code</h3>
            <div class='qr-code'>
                <img src='data:image/png;base64,{qrCodeBase64}' alt='QR Code' style='width: 256px; height: 256px;' />
            </div>
            <p style='margin: 15px 0 5px 0; font-family: monospace; font-size: 14px;'>{ticket.QrCode ?? ticket.TicketNumber}</p>
            <p style='color: #666; font-size: 14px;'>Present this QR code at the venue entrance</p>
        </div>

        <div class='warning'>
            <strong>⚠️ Important:</strong> Do not share this QR code. Each ticket is valid for one-time entry only.
        </div>

        <div class='footer'>
            <p><strong>Tickify</strong> - Your Event Ticketing Platform</p>
            <p>Valid until {ticket.EventEndDate:MMMM dd, yyyy} 11:59 PM</p>
            <p style='font-size: 12px; color: #999; margin-top: 10px;'>
                For support, contact us at support@tickify.com
            </p>
        </div>
    </div>
</body>
</html>";
    }
}
