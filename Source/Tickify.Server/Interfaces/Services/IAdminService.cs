using Tickify.DTOs.Admin;
using Tickify.DTOs.Event;
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
    Task<List<Event>> GetAllEventsAsync(); // Get all events for admin dashboard
    Task<List<EventAnalyticsDto>> GetAllEventsWithAnalyticsAsync(); // Get events with analytics data for charts
    Task<Event> ApproveEventAsync(int eventId, int adminId);
    Task<Event> RejectEventAsync(int eventId, int adminId, string? rejectionReason = null);

    // Dashboard Statistics
    Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
    Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int months = 6);
    Task<List<CategoryDistributionDto>> GetCategoryDistributionAsync();
    Task<List<RecentUserDto>> GetRecentUsersAsync(int count = 5);
    Task<List<OrganizerListDto>> GetOrganizersListAsync();
    Task<List<AdminBookingDto>> GetAllBookingsAsync();
}
