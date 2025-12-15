using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Tickify.Hubs;

public class SeatHub : Hub
{
    // Track which users are viewing which events
    private static readonly ConcurrentDictionary<string, HashSet<int>> _eventViewers = new();

    public async Task JoinEventSeatMap(int eventId)
    {
        var groupName = $"Event_{eventId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        
        // Track viewer
        _eventViewers.AddOrUpdate(
            Context.ConnectionId,
            new HashSet<int> { eventId },
            (key, set) => { set.Add(eventId); return set; }
        );
        
        Console.WriteLine($"[SeatHub] Connection {Context.ConnectionId} joined event {eventId}");
    }

    public async Task LeaveEventSeatMap(int eventId)
    {
        var groupName = $"Event_{eventId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        
        // Remove from tracking
        if (_eventViewers.TryGetValue(Context.ConnectionId, out var events))
        {
            events.Remove(eventId);
        }
        
        Console.WriteLine($"[SeatHub] Connection {Context.ConnectionId} left event {eventId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up when user disconnects
        if (_eventViewers.TryRemove(Context.ConnectionId, out var events))
        {
            foreach (var eventId in events)
            {
                var groupName = $"Event_{eventId}";
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            }
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}
