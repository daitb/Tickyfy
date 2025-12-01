using Tickify.DTOs.Organizer;
using Tickify.Models;

namespace Tickify.Interfaces.Services;

/// Organizer Service Interface - Business logic for organizer management
public interface IOrganizerService
{
    /// Register new organizer (User becomes Organizer) - DEPRECATED: Use CreateOrganizerRequestAsync instead
    Task<OrganizerDto> RegisterOrganizerAsync(int userId, CreateOrganizerDto dto);

    /// Create organizer request (User submits request to become organizer)
    Task<OrganizerRequest> CreateOrganizerRequestAsync(int userId, CreateOrganizerDto dto);

    /// Get pending organizer request for a user
    Task<OrganizerRequest?> GetPendingOrganizerRequestAsync(int userId);

    /// Get organizer by user ID
    Task<Organizer?> GetOrganizerByUserIdAsync(int userId);

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
