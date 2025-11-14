using Tickify.Common;
using Tickify.DTOs.Event;
using Tickify.Models;

namespace Tickify.Interfaces.Repositories;

public interface IEventRepository
{
    Task<Event?> GetByIdAsync(int id, bool includeRelated = false);

    Task<PagedResult<Event>> GetAllAsync(EventFilterDto filter);

    Task<List<Event>> GetFeaturedEventsAsync(int count = 10);
    
    Task<List<Event>> GetUpcomingEventsAsync(int count = 20);

    Task<PagedResult<Event>> SearchEventsAsync(string searchTerm, int pageNumber = 1, int pageSize = 20);

    Task<PagedResult<Event>> GetByOrganizerIdAsync(int organizerId, int pageNumber = 1, int pageSize = 20);

    Task<PagedResult<Event>> GetByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 20);

    Task<List<Event>> GetPendingApprovalAsync();

    Task<bool> ExistsAsync(int id);

    Task<bool> IsOrganizerOwnerAsync(int eventId, int organizerId);

    Task<Event> AddAsync(Event eventEntity);

    Task<Event> UpdateAsync(Event eventEntity);

    Task<bool> DeleteAsync(int id);

    Task<int> SaveChangesAsync();

    Task<int> GetTotalCountAsync(EventStatus? status = null);

    Task<int> GetCountByOrganizerAsync(int organizerId);
}
