using System.Security.Claims;
using Tickify.DTOs.Notification;
using Tickify.Models;

namespace Tickify.Interfaces.Services;

/// <summary>
/// Interface for Notification Service
/// Handles: Create notifications, Mark as read, Real-time push via SignalR
/// </summary>
public interface INotificationService
{
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(ClaimsPrincipal user);
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
}
