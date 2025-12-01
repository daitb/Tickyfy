using Tickify.DTOs.Admin;
using Tickify.Models;

namespace Tickify.Interfaces.Services;

public interface IAdminService
{
    // Organizer Requests
    Task<List<OrganizerRequest>> GetAllOrganizerRequestsAsync();
    Task<OrganizerRequest?> GetOrganizerRequestByIdAsync(int requestId);
    Task<OrganizerRequest> ApproveOrganizerRequestAsync(int requestId, int adminId);
    Task<OrganizerRequest> RejectOrganizerRequestAsync(int requestId, int adminId, string? reviewNotes = null);
    
    // Event Approval
    Task<List<Event>> GetAllPendingEventsAsync();
    Task<Event> ApproveEventAsync(int eventId, int adminId);
    Task<Event> RejectEventAsync(int eventId, int adminId, string? rejectionReason = null);
}
