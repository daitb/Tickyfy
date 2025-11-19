using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Support;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Services.Email;

namespace Tickify.Services;

/// <summary>
/// Support Service - Business logic for support ticket management
/// </summary>
public class SupportService : ISupportService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<SupportService> _logger;

    public SupportService(
        ApplicationDbContext context,
        IEmailService emailService,
        ILogger<SupportService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Create new support ticket (authenticated user or guest)
    /// </summary>
    public async Task<SupportTicketDetailDto> CreateSupportTicketAsync(CreateSupportTicketDto dto, int? userId = null)
    {
        _logger.LogInformation("Creating support ticket for {Email}", dto.Email);

        var ticket = new SupportTicket
        {
            UserId = userId,
            Name = dto.Name,
            Email = dto.Email,
            Subject = dto.Subject,
            Message = dto.Message,
            Status = "Open",
            Priority = "Normal",
            CreatedAt = DateTime.UtcNow
        };

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Support ticket created with ID: {TicketId}", ticket.Id);

        // Send confirmation email
        try
        {
            await _emailService.SendSupportTicketConfirmationEmailAsync(
                dto.Email,
                dto.Name,
                ticket.Id.ToString(),
                dto.Subject
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send support ticket confirmation email to {Email}", dto.Email);
        }

        return MapToSupportTicketDetailDto(ticket);
    }

    /// <summary>
    /// Get all support tickets with optional filters
    /// </summary>
    public async Task<List<SupportTicketDto>> GetAllSupportTicketsAsync(string? status = null, int? userId = null)
    {
        _logger.LogInformation("Fetching support tickets with status: {Status}", status ?? "All");

        var query = _context.SupportTickets.AsQueryable();

        // Filter by status
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }

        // Filter by user if specified (for user's own tickets)
        if (userId.HasValue)
        {
            query = query.Where(t => t.UserId == userId.Value);
        }

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new SupportTicketDto
            {
                TicketId = t.Id,
                TicketNumber = t.Id.ToString("D6"),
                UserId = t.UserId ?? 0,
                UserName = t.Name,
                Subject = t.Subject,
                Status = t.Status,
                Priority = t.Priority,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.Messages!.OrderByDescending(m => m.CreatedAt).Select(m => m.CreatedAt).FirstOrDefault()
            })
            .ToListAsync();

        return tickets;
    }

    /// <summary>
    /// Get support ticket details by ID
    /// </summary>
    public async Task<SupportTicketDetailDto?> GetSupportTicketByIdAsync(int ticketId, int? userId = null, bool isAdmin = false)
    {
        _logger.LogInformation("Fetching support ticket details for ID: {TicketId}", ticketId);

        var ticket = await _context.SupportTickets
            .Include(t => t.User)
            .Include(t => t.AssignedToStaff)
            .Include(t => t.Messages!)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
        {
            return null;
        }

        // Check permission - user can only view their own tickets unless admin
        if (!isAdmin && userId.HasValue && ticket.UserId != userId.Value)
        {
            throw new ForbiddenException("You don't have permission to view this support ticket");
        }

        return MapToSupportTicketDetailDto(ticket);
    }

    /// <summary>
    /// Add message to support ticket
    /// </summary>
    public async Task<SupportMessageDto> AddMessageToTicketAsync(int ticketId, AddMessageDto dto, int userId, bool isStaff = false)
    {
        _logger.LogInformation("Adding message to ticket {TicketId} by user {UserId}", ticketId, userId);

        var ticket = await _context.SupportTickets
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
        {
            throw new NotFoundException($"Support ticket with ID {ticketId} not found");
        }

        // Check permission - user can only add message to their own tickets unless staff
        if (!isStaff && ticket.UserId != userId)
        {
            throw new ForbiddenException("You don't have permission to add messages to this ticket");
        }

        var message = new SupportMessage
        {
            SupportTicketId = ticketId,
            UserId = userId,
            Message = dto.Message,
            IsStaffReply = isStaff,
            CreatedAt = DateTime.UtcNow
        };

        _context.SupportMessages.Add(message);

        // Update ticket status if it was closed
        if (ticket.Status == "Closed")
        {
            ticket.Status = "Open";
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Message added to ticket {TicketId}", ticketId);

        // Send notification email
        try
        {
            var user = await _context.Users.FindAsync(userId);
            var recipientEmail = isStaff ? ticket.Email : ticket.User?.Email;
            var recipientName = isStaff ? ticket.Name : ticket.User?.FullName;

            if (!string.IsNullOrEmpty(recipientEmail) && !string.IsNullOrEmpty(recipientName))
            {
                await _emailService.SendSupportTicketUpdateEmailAsync(
                    recipientEmail,
                    recipientName,
                    ticketId.ToString("D6"),
                    ticket.Subject,
                    dto.Message,
                    isStaff
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send support ticket update email for ticket {TicketId}", ticketId);
        }

        return new SupportMessageDto
        {
            MessageId = message.Id,
            UserId = message.UserId ?? 0,
            UserName = (await _context.Users.FindAsync(userId))?.FullName ?? "Unknown",
            Message = message.Message,
            IsStaffResponse = message.IsStaffReply,
            CreatedAt = message.CreatedAt
        };
    }

    /// <summary>
    /// Assign ticket to staff (Admin only)
    /// </summary>
    public async Task<SupportTicketDto> AssignTicketToStaffAsync(int ticketId, int staffId, int adminId)
    {
        _logger.LogInformation("Admin {AdminId} assigning ticket {TicketId} to staff {StaffId}", 
            adminId, ticketId, staffId);

        var ticket = await _context.SupportTickets.FindAsync(ticketId);

        if (ticket == null)
        {
            throw new NotFoundException($"Support ticket with ID {ticketId} not found");
        }

        // Verify staff user exists
        var staff = await _context.Users.FindAsync(staffId);
        if (staff == null)
        {
            throw new NotFoundException($"Staff user with ID {staffId} not found");
        }

        ticket.AssignedToStaffId = staffId;
        ticket.Status = "InProgress";

        await _context.SaveChangesAsync();

        _logger.LogInformation("Ticket {TicketId} assigned to staff {StaffId}", ticketId, staffId);

        return MapToSupportTicketDto(ticket);
    }

    /// <summary>
    /// Resolve support ticket
    /// </summary>
    public async Task<SupportTicketDto> ResolveTicketAsync(int ticketId, int userId, bool isAdmin = false)
    {
        _logger.LogInformation("User {UserId} resolving ticket {TicketId}", userId, ticketId);

        var ticket = await _context.SupportTickets.FindAsync(ticketId);

        if (ticket == null)
        {
            throw new NotFoundException($"Support ticket with ID {ticketId} not found");
        }

        // Check permission
        if (!isAdmin && ticket.AssignedToStaffId != userId)
        {
            throw new ForbiddenException("You don't have permission to resolve this ticket");
        }

        ticket.Status = "Resolved";
        ticket.ResolvedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Ticket {TicketId} marked as resolved", ticketId);

        // Send resolution email
        try
        {
            await _emailService.SendSupportTicketResolvedEmailAsync(
                ticket.Email,
                ticket.Name,
                ticketId.ToString("D6"),
                ticket.Subject
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send support ticket resolution email for ticket {TicketId}", ticketId);
        }

        return MapToSupportTicketDto(ticket);
    }

    /// <summary>
    /// Update ticket priority (Admin only)
    /// </summary>
    public async Task<SupportTicketDto> UpdateTicketPriorityAsync(int ticketId, string priority, int adminId)
    {
        _logger.LogInformation("Admin {AdminId} updating priority for ticket {TicketId} to {Priority}", 
            adminId, ticketId, priority);

        var validPriorities = new[] { "Low", "Normal", "High", "Urgent" };
        if (!validPriorities.Contains(priority))
        {
            throw new BadRequestException($"Invalid priority. Valid values: {string.Join(", ", validPriorities)}");
        }

        var ticket = await _context.SupportTickets.FindAsync(ticketId);

        if (ticket == null)
        {
            throw new NotFoundException($"Support ticket with ID {ticketId} not found");
        }

        ticket.Priority = priority;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Ticket {TicketId} priority updated to {Priority}", ticketId, priority);

        return MapToSupportTicketDto(ticket);
    }

    #region Helper Methods

    private SupportTicketDto MapToSupportTicketDto(SupportTicket ticket)
    {
        return new SupportTicketDto
        {
            TicketId = ticket.Id,
            TicketNumber = ticket.Id.ToString("D6"),
            UserId = ticket.UserId ?? 0,
            UserName = ticket.Name,
            Subject = ticket.Subject,
            Status = ticket.Status,
            Priority = ticket.Priority,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.Messages?.OrderByDescending(m => m.CreatedAt).Select(m => m.CreatedAt).FirstOrDefault()
        };
    }

    private SupportTicketDetailDto MapToSupportTicketDetailDto(SupportTicket ticket)
    {
        return new SupportTicketDetailDto
        {
            TicketId = ticket.Id,
            TicketNumber = ticket.Id.ToString("D6"),
            UserId = ticket.UserId,
            UserName = ticket.Name,
            Email = ticket.Email,
            Subject = ticket.Subject,
            Message = ticket.Message,
            Status = ticket.Status,
            Priority = ticket.Priority,
            AssignedToStaffId = ticket.AssignedToStaffId,
            AssignedToStaffName = ticket.AssignedToStaff?.FullName,
            Messages = ticket.Messages?.OrderBy(m => m.CreatedAt).Select(m => new SupportMessageDto
            {
                MessageId = m.Id,
                UserId = m.UserId ?? 0,
                UserName = m.User?.FullName ?? "Unknown",
                Message = m.Message,
                IsStaffResponse = m.IsStaffReply,
                CreatedAt = m.CreatedAt
            }).ToList() ?? new List<SupportMessageDto>(),
            CreatedAt = ticket.CreatedAt,
            ResolvedAt = ticket.ResolvedAt
        };
    }

    #endregion
}
