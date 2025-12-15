using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Support;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

/// Support Controller - Manages support tickets and messages
[ApiController]
[Route("api/support")]
[Produces("application/json")]
public class SupportController : ControllerBase
{
    private readonly ISupportService _supportService;
    private readonly ILogger<SupportController> _logger;

    public SupportController(
        ISupportService supportService,
        ILogger<SupportController> logger)
    {
        _supportService = supportService;
        _logger = logger;
    }

    /// POST /api/support/tickets - Create new support ticket
    [HttpPost("tickets")]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDetailDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> CreateSupportTicket(
        [FromBody] CreateSupportTicketDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<SupportTicketDetailDto>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        // Get userId if user is authenticated, otherwise null for guest
        int? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            userId = GetUserIdFromClaims();
        }

        _logger.LogInformation("Creating support ticket for {Email}", dto.Email);

        var ticket = await _supportService.CreateSupportTicketAsync(dto, userId);

        return CreatedAtAction(
            nameof(GetSupportTicketById),
            new { id = ticket.TicketId },
            ApiResponse<SupportTicketDetailDto>.SuccessResponse(
                ticket,
                "Support ticket created successfully. We'll get back to you soon!"
            )
        );
    }

    /// GET /api/support/tickets - Get all support tickets with filters
    [HttpGet("tickets")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<SupportTicketDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<SupportTicketDto>>>> GetSupportTickets(
        [FromQuery] string? status = null)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Fetching support tickets for user {UserId}", userId);

        // Admin can see all tickets, users see only their own
        var tickets = isAdmin
            ? await _supportService.GetAllSupportTicketsAsync(status)
            : await _supportService.GetAllSupportTicketsAsync(status, userId);

        return Ok(ApiResponse<List<SupportTicketDto>>.SuccessResponse(
            tickets,
            $"Retrieved {tickets.Count} support tickets"
        ));
    }

    /// GET /api/support/tickets/{id} - Get support ticket details
    [HttpGet("tickets/{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDetailDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<SupportTicketDetailDto>>> GetSupportTicketById(int id)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Fetching support ticket details for ID: {TicketId}", id);

        var ticket = await _supportService.GetSupportTicketByIdAsync(id, userId, isAdmin);

        if (ticket == null)
        {
            return NotFound(ApiResponse<SupportTicketDetailDto>.FailureResponse(
                $"Support ticket with ID {id} not found"
            ));
        }

        return Ok(ApiResponse<SupportTicketDetailDto>.SuccessResponse(
            ticket,
            "Support ticket details retrieved successfully"
        ));
    }

    /// POST /api/support/tickets/{id}/messages - Add message to support ticket
    [HttpPost("tickets/{id}/messages")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<SupportMessageDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<SupportMessageDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<SupportMessageDto>>> AddMessageToTicket(
        int id,
        [FromBody] AddMessageDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<SupportMessageDto>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        var userId = GetUserIdFromClaims();
        var isStaff = User.IsInRole("Admin") || User.IsInRole("Support");

        _logger.LogInformation("User {UserId} adding message to ticket {TicketId}", userId, id);

        var message = await _supportService.AddMessageToTicketAsync(id, dto, userId, isStaff);

        return CreatedAtAction(
            nameof(GetSupportTicketById),
            new { id },
            ApiResponse<SupportMessageDto>.SuccessResponse(
                message,
                "Message added successfully"
            )
        );
    }

    #region Admin Endpoints

    /// POST /api/support/tickets/{id}/assign - Assign ticket to staff (Admin only)
    [HttpPost("tickets/{id}/assign")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> AssignTicketToStaff(
        int id,
        [FromBody] AssignTicketRequest request)
    {
        if (request.StaffId <= 0)
        {
            return BadRequest(ApiResponse<SupportTicketDto>.FailureResponse(
                "Invalid staff ID"
            ));
        }

        var adminId = GetUserIdFromClaims();

        _logger.LogInformation("Admin {AdminId} assigning ticket {TicketId} to staff {StaffId}",
            adminId, id, request.StaffId);

        var ticket = await _supportService.AssignTicketToStaffAsync(id, request.StaffId, adminId);

        return Ok(ApiResponse<SupportTicketDto>.SuccessResponse(
            ticket,
            "Ticket assigned successfully"
        ));
    }

    /// POST /api/support/tickets/{id}/resolve - Resolve support ticket
    [HttpPost("tickets/{id}/resolve")]
    [Authorize(Roles = "Admin,Support")]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> ResolveTicket(int id)
    {
        var userId = GetUserIdFromClaims();
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("User {UserId} resolving ticket {TicketId}", userId, id);

        var ticket = await _supportService.ResolveTicketAsync(id, userId, isAdmin);

        return Ok(ApiResponse<SupportTicketDto>.SuccessResponse(
            ticket,
            "Ticket marked as resolved"
        ));
    }

    /// PUT /api/support/tickets/{id}/priority - Update ticket priority (Admin only)
    [HttpPut("tickets/{id}/priority")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SupportTicketDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<SupportTicketDto>>> UpdateTicketPriority(
        int id,
        [FromBody] UpdatePriorityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Priority))
        {
            return BadRequest(ApiResponse<SupportTicketDto>.FailureResponse(
                "Priority is required"
            ));
        }

        var adminId = GetUserIdFromClaims();

        _logger.LogInformation("Admin {AdminId} updating priority for ticket {TicketId}",
            adminId, id);

        var ticket = await _supportService.UpdateTicketPriorityAsync(id, request.Priority, adminId);

        return Ok(ApiResponse<SupportTicketDto>.SuccessResponse(
            ticket,
            "Ticket priority updated successfully"
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

/// Request model for assigning tickets to staff
public class AssignTicketRequest
{
    public int StaffId { get; set; }
}

/// Request model for updating ticket priority
public class UpdatePriorityRequest
{
    public string Priority { get; set; } = string.Empty;
}
