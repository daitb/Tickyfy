using Tickify.DTOs.Organizer;

namespace Tickify.Interfaces.Services;

/// Organizer Service Interface - Business logic for organizer management
public interface IOrganizerService
{
    /// Register new organizer (User becomes Organizer)
    Task<OrganizerDto> RegisterOrganizerAsync(int userId, CreateOrganizerDto dto);

    /// Get organizer profile by ID
    Task<OrganizerProfileDto?> GetOrganizerProfileAsync(int organizerId);

    /// Update organizer profile
    Task<OrganizerProfileDto> UpdateOrganizerProfileAsync(int organizerId, int userId, CreateOrganizerDto dto);

    /// Get all events for an organizer
    Task<List<OrganizerEventDashboardDto>> GetOrganizerEventsAsync(int organizerId, int userId);

    /// Get organizer earnings dashboard
    Task<OrganizerEarningsDto> GetOrganizerEarningsAsync(int organizerId, int userId);

    /// Verify organizer (Admin only)
    Task<OrganizerDto> VerifyOrganizerAsync(int organizerId, int adminId);

    /// Get all organizers (Admin only)
    Task<List<OrganizerDto>> GetAllOrganizersAsync();
}
