using Tickify.Common;
using Tickify.DTOs.Event;
using Tickify.Models;

namespace Tickify.Interfaces.Services;

public interface IEventService
{
    Task<PagedResult<EventListDto>> GetAllEventsAsync(EventFilterDto filter);

    Task<EventDetailDto?> GetEventByIdAsync(int id);

    Task<List<EventCardDto>> GetFeaturedEventsAsync(int count = 10);

    Task<List<EventCardDto>> GetUpcomingEventsAsync(int count = 20);

    Task<PagedResult<EventListDto>> SearchEventsAsync(string searchTerm, int pageNumber = 1, int pageSize = 20);

    Task<EventDetailDto> CreateEventAsync(CreateEventDto dto, int organizerId);

    Task<EventDetailDto> UpdateEventAsync(int id, UpdateEventDto dto, int userId, bool isAdmin = false);

    Task<EventDetailDto> PublishEventAsync(int id, int organizerId);

    Task<bool> CancelEventAsync(int id, int userId, bool isAdmin, string? reason = null);

    Task<EventDetailDto> DuplicateEventAsync(int id, int organizerId);

    Task<EventDetailDto> ApproveEventAsync(int id, int adminId);

    Task<EventDetailDto> RejectEventAsync(int id, int adminId, string reason);

    Task<bool> DeleteEventAsync(int id);

    Task<EventStatsDto> GetEventStatisticsAsync(int id, int userId, bool isAdmin);

    Task<bool> IsOrganizerOwnerAsync(int eventId, int organizerId);

    Task<bool> CanEditEventAsync(int eventId);

    Task<bool> CanCancelEventAsync(int eventId);
}
