using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Common;
using Tickify.DTOs.Notification;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

/// <summary>
/// Notification Controller - Quản lý thông báo của người dùng
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
[Produces("application/json")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(
        INotificationService notificationService,
        ILogger<NotificationController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/notifications - Lấy danh sách thông báo của user hiện tại (với pagination & filtering)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<NotificationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? type = null,
        [FromQuery] bool? isRead = null)
    {
        try
        {
            _logger.LogInformation("[NotificationController] Fetching notifications for user - Page: {Page}, PageSize: {PageSize}, Type: {Type}, IsRead: {IsRead}", 
                page, pageSize, type, isRead);
            
            var result = await _notificationService.GetUserNotificationsPagedAsync(User, page, pageSize, type, isRead);
            
            return Ok(ApiResponse<PagedResult<NotificationDto>>.SuccessResponse(
                result,
                $"Retrieved {result.Items.Count} notifications (Page {result.PageNumber}/{result.TotalPages})"
            ));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("[NotificationController] Unauthorized access: {Message}", ex.Message);
            return Unauthorized(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[NotificationController] Error fetching notifications");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.FailureResponse("An error occurred while fetching notifications"));
        }
    }

    /// <summary>
    /// GET /api/notifications/unread-count - Lấy số lượng thông báo chưa đọc
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        try
        {
            _logger.LogInformation("[NotificationController] Fetching unread count for user");
            var count = await _notificationService.GetUnreadCountAsync(User);
            
            return Ok(ApiResponse<int>.SuccessResponse(
                count,
                $"Unread notifications: {count}"
            ));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("[NotificationController] Unauthorized access: {Message}", ex.Message);
            return Unauthorized(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[NotificationController] Error fetching unread count");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.FailureResponse("An error occurred while fetching unread count"));
        }
    }

    /// <summary>
    /// PUT /api/notifications/{id}/read - Đánh dấu một thông báo là đã đọc
    /// </summary>
    [HttpPut("{id}/read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int id)
    {
        try
        {
            _logger.LogInformation("[NotificationController] Marking notification {Id} as read", id);
            var success = await _notificationService.MarkAsReadAsync(id, User);
            
            if (!success)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    $"Notification with ID {id} not found or you don't have permission to access it"
                ));
            }

            return Ok(ApiResponse<object>.SuccessResponse(
                null,
                "Notification marked as read"
            ));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("[NotificationController] Unauthorized access: {Message}", ex.Message);
            return Unauthorized(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[NotificationController] Error marking notification as read");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.FailureResponse("An error occurred while marking notification as read"));
        }
    }

    /// <summary>
    /// PUT /api/notifications/read-all - Đánh dấu tất cả thông báo là đã đọc
    /// </summary>
    [HttpPut("read-all")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead()
    {
        try
        {
            _logger.LogInformation("[NotificationController] Marking all notifications as read");
            var success = await _notificationService.MarkAllAsReadAsync(User);
            
            return Ok(ApiResponse<object>.SuccessResponse(
                null,
                "All notifications marked as read"
            ));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("[NotificationController] Unauthorized access: {Message}", ex.Message);
            return Unauthorized(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[NotificationController] Error marking all notifications as read");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.FailureResponse("An error occurred while marking all notifications as read"));
        }
    }

    /// <summary>
    /// DELETE /api/notifications/{id} - Xóa một thông báo
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteNotification(int id)
    {
        try
        {
            _logger.LogInformation("[NotificationController] Deleting notification {Id}", id);
            var success = await _notificationService.DeleteNotificationAsync(id, User);
            
            if (!success)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    $"Notification with ID {id} not found or you don't have permission to delete it"
                ));
            }

            return Ok(ApiResponse<object>.SuccessResponse(
                null,
                "Notification deleted successfully"
            ));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("[NotificationController] Unauthorized access: {Message}", ex.Message);
            return Unauthorized(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[NotificationController] Error deleting notification");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<object>.FailureResponse("An error occurred while deleting notification"));
        }
    }
}

