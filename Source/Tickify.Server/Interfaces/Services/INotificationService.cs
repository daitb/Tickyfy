using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Notification;
using Tickify.Models;

namespace Tickify.Interfaces.Services;


public interface INotificationService
{
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(ClaimsPrincipal user);
    Task<PagedResult<NotificationDto>> GetUserNotificationsPagedAsync(
        ClaimsPrincipal user, 
        int page = 1, 
        int pageSize = 20, 
        string? type = null, 
        bool? isRead = null);
    Task<int> GetUnreadCountAsync(ClaimsPrincipal user);
    Task<bool> MarkAsReadAsync(int notificationId, ClaimsPrincipal user);
    Task<bool> MarkAllAsReadAsync(ClaimsPrincipal user);
    Task<bool> DeleteNotificationAsync(int notificationId, ClaimsPrincipal user);
    
    // Helper methods for common notification scenarios
    Task NotifyBookingConfirmedAsync(int userId, int bookingId, string eventName);
    Task NotifyEventApprovedAsync(int organizerId, int eventId, string eventName);
    Task NotifyEventRejectedAsync(int organizerId, int eventId, string eventName, string reason);
    Task NotifyPaymentSuccessAsync(int userId, int bookingId, decimal amount);
    Task NotifyPaymentFailedAsync(int userId, int bookingId);
    Task NotifyTicketTransferAsync(int recipientUserId, int ticketId, string eventName, string senderName);
    Task NotifyRefundApprovedAsync(int userId, int refundId, decimal amount);
    Task NotifyRefundRejectedAsync(int userId, int refundId, string reason);
    Task NotifyWaitlistAvailableAsync(int userId, int eventId, string eventName);
    Task NotifyEventReminderAsync(int userId, int eventId, string eventName, DateTime eventStartDate);
}
