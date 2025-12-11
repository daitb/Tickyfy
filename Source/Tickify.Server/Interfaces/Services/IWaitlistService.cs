using Tickify.DTOs.Waitlist;

namespace Tickify.Interfaces.Services;

public interface IWaitlistService
{
    /// <summary>
    /// Get all waitlist entries for the current user
    /// </summary>
    Task<List<WaitlistDto>> GetMyWaitlistEntriesAsync(int userId);

    /// <summary>
    /// Join waitlist for an event
    /// </summary>
    Task<WaitlistDto> JoinWaitlistAsync(int userId, JoinWaitlistDto dto);

    /// <summary>
    /// Leave/remove from waitlist
    /// </summary>
    Task<bool> LeaveWaitlistAsync(int userId, int waitlistId);

    /// <summary>
    /// Check if user is on waitlist for an event
    /// </summary>
    Task<bool> IsUserOnWaitlistAsync(int userId, int eventId, int? ticketTypeId = null);
}
