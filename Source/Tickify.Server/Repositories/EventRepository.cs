using Microsoft.EntityFrameworkCore;
using Tickify.Common;
using Tickify.Data;
using Tickify.DTOs.Event;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public class EventRepository : IEventRepository
{
    private readonly ApplicationDbContext _context;

    public EventRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Event?> GetByIdAsync(int id, bool includeRelated = false)
    {
        var query = _context.Events.AsQueryable();

        if (includeRelated)
        {
            query = query
                .Include(e => e.Category)
                .Include(e => e.Organizer)
                    .ThenInclude(o => o!.User)
                .Include(e => e.TicketTypes)
                .Include(e => e.ApprovedByStaff)
                .Include(e => e.Reviews)
                .Include(e => e.Bookings!)
                    .ThenInclude(b => b.Tickets)
                .Include(e => e.Bookings!)
                    .ThenInclude(b => b.User);
        }

        return await query.FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<PagedResult<Event>> GetAllAsync(EventFilterDto filter)
    {
        filter.ValidatePageSize();

        var query = _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Include(e => e.TicketTypes)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var searchLower = filter.SearchTerm.ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(searchLower) ||
                e.Description.ToLower().Contains(searchLower) ||
                (e.Location != null && e.Location.ToLower().Contains(searchLower)) ||
                (e.Address != null && e.Address.ToLower().Contains(searchLower))
            );
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(e => e.CategoryId == filter.CategoryId.Value);
        }

        if (filter.OrganizerId.HasValue)
        {
            query = query.Where(e => e.OrganizerId == filter.OrganizerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (Enum.TryParse<EventStatus>(filter.Status, true, out var status))
            {
                query = query.Where(e => e.Status == status);
            }
        }

        if (filter.StartDateFrom.HasValue)
        {
            query = query.Where(e => e.StartDate >= filter.StartDateFrom.Value);
        }

        if (filter.StartDateTo.HasValue)
        {
            query = query.Where(e => e.StartDate <= filter.StartDateTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Location))
        {
            var locationLower = filter.Location.ToLower();
            query = query.Where(e =>
                e.Location.ToLower().Contains(locationLower) ||
                (e.Address != null && e.Address.ToLower().Contains(locationLower))
            );
        }

        if (filter.IsFeatured.HasValue)
        {
        }

        if (filter.MinPrice.HasValue || filter.MaxPrice.HasValue)
        {
            if (filter.MinPrice.HasValue)
            {
                query = query.Where(e => e.TicketTypes!.Any(tt => tt.Price >= filter.MinPrice.Value));
            }

            if (filter.MaxPrice.HasValue)
            {
                query = query.Where(e => e.TicketTypes!.Any(tt => tt.Price <= filter.MaxPrice.Value));
            }
        }

        var totalCount = await query.CountAsync();

        query = ApplySorting(query, filter.SortBy, filter.SortOrder);

        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResult<Event>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<List<Event>> GetFeaturedEventsAsync(int count = 10)
    {
        return await _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Include(e => e.TicketTypes)
            .Where(e => e.Status == EventStatus.Published && e.StartDate > DateTime.UtcNow)
            .OrderBy(e => e.StartDate)
            .Take(count)
            .ToListAsync();
    }

    public async Task<List<Event>> GetTrendingEventsAsync(int count = 10)
    {
        // Get events with booking counts using a subquery approach
        var eventsWithBookingCounts = await _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Include(e => e.TicketTypes)
            .Where(e => e.Status == EventStatus.Published && e.StartDate > DateTime.UtcNow)
            .Select(e => new
            {
                Event = e,
                BookingCount = e.Bookings!
                    .Count(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Pending)
            })
            .OrderByDescending(x => x.BookingCount)
            .ThenBy(x => x.Event.StartDate)
            .Take(count)
            .ToListAsync();

        return eventsWithBookingCounts.Select(x => x.Event).ToList();
    }

    public async Task<List<Event>> GetUpcomingEventsAsync(int count = 20)
    {
        return await _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Include(e => e.TicketTypes)
            .Where(e => e.Status == EventStatus.Published && e.StartDate > DateTime.UtcNow)
            .OrderBy(e => e.StartDate)
            .Take(count)
            .ToListAsync();
    }

    public async Task<PagedResult<Event>> SearchEventsAsync(string searchTerm, int pageNumber = 1, int pageSize = 20)
    {
        if (pageSize > 100) pageSize = 100;
        if (pageNumber < 1) pageNumber = 1;

        var searchLower = searchTerm.ToLower();

        var query = _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Include(e => e.TicketTypes)
            .Where(e =>
                e.Title.ToLower().Contains(searchLower) ||
                e.Description.ToLower().Contains(searchLower) ||
                (e.Location != null && e.Location.ToLower().Contains(searchLower)) ||
                (e.Address != null && e.Address.ToLower().Contains(searchLower)) ||
                e.Category!.Name.ToLower().Contains(searchLower)
            );

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(e => e.StartDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Event>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<PagedResult<Event>> GetByOrganizerIdAsync(int organizerId, int pageNumber = 1, int pageSize = 20)
    {
        if (pageSize > 100) pageSize = 100;
        if (pageNumber < 1) pageNumber = 1;

        var query = _context.Events
            .Include(e => e.Category)
            .Include(e => e.TicketTypes)
            .Where(e => e.OrganizerId == organizerId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Event>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<PagedResult<Event>> GetByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 20)
    {
        if (pageSize > 100) pageSize = 100;
        if (pageNumber < 1) pageNumber = 1;

        var query = _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Include(e => e.TicketTypes)
            .Where(e => e.CategoryId == categoryId && e.Status == EventStatus.Published);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(e => e.StartDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Event>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<List<Event>> GetPendingApprovalAsync()
    {
        return await _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Include(e => e.TicketTypes)
            .Where(e => e.Status == EventStatus.Pending)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Events.AnyAsync(e => e.Id == id);
    }

    public async Task<bool> IsOrganizerOwnerAsync(int eventId, int organizerId)
    {
        return await _context.Events
            .AnyAsync(e => e.Id == eventId && e.OrganizerId == organizerId);
    }

    public async Task<Event> AddAsync(Event eventEntity)
    {
        eventEntity.CreatedAt = DateTime.UtcNow;
        eventEntity.Status = EventStatus.Pending;

        await _context.Events.AddAsync(eventEntity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(eventEntity.Id, includeRelated: true))!;
    }

    public async Task<Event> UpdateAsync(Event eventEntity)
    {
        eventEntity.UpdatedAt = DateTime.UtcNow;

        _context.Events.Update(eventEntity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(eventEntity.Id, includeRelated: true))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var eventEntity = await _context.Events.FindAsync(id);
        if (eventEntity == null)
            return false;

        eventEntity.Status = EventStatus.Cancelled;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    /// Save changes to database
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task<int> GetTotalCountAsync(EventStatus? status = null)
    {
        var query = _context.Events.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(e => e.Status == status.Value);
        }

        return await query.CountAsync();
    }

    public async Task<int> GetCountByOrganizerAsync(int organizerId)
    {
        return await _context.Events
            .CountAsync(e => e.OrganizerId == organizerId);
    }

    private IQueryable<Event> ApplySorting(IQueryable<Event> query, string sortBy, string sortOrder)
    {
        var isDescending = sortOrder.ToLower() == "desc";

        return sortBy.ToLower() switch
        {
            "title" => isDescending
                ? query.OrderByDescending(e => e.Title)
                : query.OrderBy(e => e.Title),

            "createdat" => isDescending
                ? query.OrderByDescending(e => e.CreatedAt)
                : query.OrderBy(e => e.CreatedAt),

            "price" => isDescending
                ? query.OrderByDescending(e => e.TicketTypes!.Min(tt => tt.Price))
                : query.OrderBy(e => e.TicketTypes!.Min(tt => tt.Price)),

            "startdate" or _ => isDescending
                ? query.OrderByDescending(e => e.StartDate)
                : query.OrderBy(e => e.StartDate),
        };
    }
}
