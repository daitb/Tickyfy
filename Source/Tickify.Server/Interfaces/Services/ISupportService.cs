using Tickify.DTOs.Support;

namespace Tickify.Interfaces.Services;

/// Support Service Interface - Business logic for support ticket management
public interface ISupportService
{
    /// Create new support ticket
    Task<SupportTicketDetailDto> CreateSupportTicketAsync(CreateSupportTicketDto dto, int? userId = null);

    /// Get all support tickets with filters
    Task<List<SupportTicketDto>> GetAllSupportTicketsAsync(string? status = null, int? userId = null);

    /// Get support ticket details by ID
    Task<SupportTicketDetailDto?> GetSupportTicketByIdAsync(int ticketId, int? userId = null, bool isAdmin = false);

    /// Add message to support ticket
    Task<SupportMessageDto> AddMessageToTicketAsync(int ticketId, AddMessageDto dto, int userId, bool isStaff = false);

    /// Assign ticket to staff (Admin only)
    Task<SupportTicketDto> AssignTicketToStaffAsync(int ticketId, int staffId, int adminId);

    /// Resolve support ticket
    Task<SupportTicketDto> ResolveTicketAsync(int ticketId, int userId, bool isAdmin = false);

    /// Update ticket priority (Admin only)
    Task<SupportTicketDto> UpdateTicketPriorityAsync(int ticketId, string priority, int adminId);
}
