using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Tickify.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation($"[NotificationHub] User {userId} connected");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation($"[NotificationHub] User {userId} disconnected");
        await base.OnDisconnectedAsync(exception);
    }

    // Client can call this to confirm notification received
    public async Task NotificationReceived(int notificationId)
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation($"[NotificationHub] User {userId} confirmed receipt of notification {notificationId}");
        await Task.CompletedTask;
    }
}
