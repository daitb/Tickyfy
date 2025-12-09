using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Tickify.Common;
using Tickify.Data;
using Tickify.DTOs.Notification;
using Tickify.Hubs;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services.Notifications;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        ApplicationDbContext context,
        IMapper mapper,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _mapper = mapper;
        _hubContext = hubContext;
        _logger = logger;
    }

    private int GetUserId(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }
        return userId;
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
    {
        var notification = _mapper.Map<Notification>(dto);
        notification.CreatedAt = DateTime.UtcNow;
        notification.IsRead = false;

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        var notificationDto = _mapper.Map<NotificationDto>(notification);

        // Send real-time notification via SignalR
        try
        {
            await _hubContext.Clients.User(dto.UserId.ToString())
                .SendAsync("ReceiveNotification", notificationDto);
            _logger.LogInformation($"[NotificationService] Sent real-time notification to user {dto.UserId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"[NotificationService] Failed to send real-time notification to user {dto.UserId}");
        }

        return notificationDto;
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(ClaimsPrincipal user)
    {
        var userId = GetUserId(user);

        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50) // Limit to 50 most recent notifications
            .ToListAsync();

        return _mapper.Map<IEnumerable<NotificationDto>>(notifications);
    }

    public async Task<PagedResult<NotificationDto>> GetUserNotificationsPagedAsync(
        ClaimsPrincipal user, 
        int page = 1, 
        int pageSize = 20, 
        string? type = null, 
        bool? isRead = null)
    {
        var userId = GetUserId(user);

        // Validate pagination parameters
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100; // Max page size

        var query = _context.Notifications
            .Where(n => n.UserId == userId);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(n => n.Type == type);
        }

        if (isRead.HasValue)
        {
            query = query.Where(n => n.IsRead == isRead.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Apply pagination
        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var notificationDtos = _mapper.Map<List<NotificationDto>>(notifications);

        return new PagedResult<NotificationDto>(notificationDtos, totalCount, page, pageSize);
    }

    public async Task<int> GetUnreadCountAsync(ClaimsPrincipal user)
    {
        var userId = GetUserId(user);

        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
    }

    public async Task<bool> MarkAsReadAsync(int notificationId, ClaimsPrincipal user)
    {
        var userId = GetUserId(user);

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return false;

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(ClaimsPrincipal user)
    {
        var userId = GetUserId(user);

        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteNotificationAsync(int notificationId, ClaimsPrincipal user)
    {
        var userId = GetUserId(user);

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return true;
    }

    // Helper methods for common notification scenarios

    public async Task NotifyBookingConfirmedAsync(int userId, int bookingId, string eventName)
    {
        var dto = new CreateNotificationDto
        {
            UserId = userId,
            Title = "Booking Confirmed",
            Message = $"Your booking for '{eventName}' has been confirmed. Your tickets are ready!",
            Type = "BookingConfirmed",
            ActionUrl = $"/orders/{bookingId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyEventApprovedAsync(int organizerId, int eventId, string eventName)
    {
        // Get organizer's user account
        var organizer = await _context.Organizers
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == organizerId);

        if (organizer?.User == null) return;

        var dto = new CreateNotificationDto
        {
            UserId = organizer.User.Id,
            Title = "Event Approved",
            Message = $"Your event '{eventName}' has been approved and is now live!",
            Type = "EventApproved",
            ActionUrl = $"/events/{eventId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyEventRejectedAsync(int organizerId, int eventId, string eventName, string reason)
    {
        var organizer = await _context.Organizers
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == organizerId);

        if (organizer?.User == null) return;

        var dto = new CreateNotificationDto
        {
            UserId = organizer.User.Id,
            Title = "Event Rejected",
            Message = $"Your event '{eventName}' has been rejected. Reason: {reason}",
            Type = "EventRejected",
            ActionUrl = $"/events/{eventId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyPaymentSuccessAsync(int userId, int bookingId, decimal amount)
    {
        var dto = new CreateNotificationDto
        {
            UserId = userId,
            Title = "Payment Successful",
            Message = $"Payment of {amount:C} has been processed successfully.",
            Type = "PaymentSuccess",
            ActionUrl = $"/orders/{bookingId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyPaymentFailedAsync(int userId, int bookingId)
    {
        var dto = new CreateNotificationDto
        {
            UserId = userId,
            Title = "Payment Failed",
            Message = "Your payment could not be processed. Please try again.",
            Type = "PaymentFailed",
            ActionUrl = $"/orders/{bookingId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyTicketTransferAsync(int recipientUserId, int ticketId, string eventName, string senderName)
    {
        var dto = new CreateNotificationDto
        {
            UserId = recipientUserId,
            Title = "Ticket Transfer",
            Message = $"{senderName} has transferred a ticket for '{eventName}' to you.",
            Type = "TicketTransfer",
            ActionUrl = $"/tickets/{ticketId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyRefundApprovedAsync(int userId, int refundId, decimal amount)
    {
        var dto = new CreateNotificationDto
        {
            UserId = userId,
            Title = "Refund Approved",
            Message = $"Your refund request has been approved. Amount: {amount:C}",
            Type = "RefundApproved",
            ActionUrl = $"/refunds/{refundId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyRefundRejectedAsync(int userId, int refundId, string reason)
    {
        var dto = new CreateNotificationDto
        {
            UserId = userId,
            Title = "Refund Rejected",
            Message = $"Your refund request has been rejected. Reason: {reason}",
            Type = "RefundRejected",
            ActionUrl = $"/refunds/{refundId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyWaitlistAvailableAsync(int userId, int eventId, string eventName)
    {
        var dto = new CreateNotificationDto
        {
            UserId = userId,
            Title = "Tickets Available",
            Message = $"Good news! Tickets are now available for '{eventName}'. Book now before they're gone!",
            Type = "WaitlistAvailable",
            ActionUrl = $"/events/{eventId}"
        };

        await CreateNotificationAsync(dto);
    }

    public async Task NotifyEventReminderAsync(int userId, int eventId, string eventName, DateTime eventStartDate)
    {
        var timeUntilEvent = eventStartDate - DateTime.UtcNow;
        var hoursUntilEvent = (int)timeUntilEvent.TotalHours;
        var timeText = hoursUntilEvent < 24 ? $"{hoursUntilEvent} hours" : "24 hours";

        var dto = new CreateNotificationDto
        {
            UserId = userId,
            Title = "Event Reminder",
            Message = $"'{eventName}' starts in {timeText}. Don't forget to bring your tickets!",
            Type = "EventReminder",
            ActionUrl = $"/events/{eventId}"
        };

        await CreateNotificationAsync(dto);
    }
}
