using Microsoft.EntityFrameworkCore;
using Tickify.Common;
using Tickify.Data;
using Tickify.DTOs.Event;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Services.Email;

namespace Tickify.Services;

/// Event Service - Business logic for event management
public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public EventService(
        IEventRepository eventRepository,
        ApplicationDbContext context,
        IEmailService emailService)
    {
        _eventRepository = eventRepository;
        _context = context;
        _emailService = emailService;
    }

    #region Public Queries (No Authentication Required)

    /// Get all events with filtering, sorting and pagination
    public async Task<PagedResult<EventListDto>> GetAllEventsAsync(EventFilterDto filter)
    {
        // Get paged events from repository
        var pagedEvents = await _eventRepository.GetAllAsync(filter);

        // Map to EventListDto
        var eventListDtos = pagedEvents.Items.Select(MapToEventListDto).ToList();

        return new PagedResult<EventListDto>(
            eventListDtos,
            pagedEvents.TotalCount,
            pagedEvents.PageNumber,
            pagedEvents.PageSize
        );
    }

    /// Get event details by ID
    public async Task<EventDetailDto?> GetEventByIdAsync(int id)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);

        if (eventEntity == null)
            return null;

        return MapToEventDetailDto(eventEntity);
    }

    /// Get featured events for homepage
    public async Task<List<EventCardDto>> GetFeaturedEventsAsync(int count = 10)
    {
        var events = await _eventRepository.GetFeaturedEventsAsync(count);
        return events.Select(MapToEventCardDto).ToList();
    }

    /// Get upcoming events (published and future)
    public async Task<List<EventCardDto>> GetUpcomingEventsAsync(int count = 20)
    {
        var events = await _eventRepository.GetUpcomingEventsAsync(count);
        return events.Select(MapToEventCardDto).ToList();
    }

    /// Search events by keyword with pagination
    public async Task<PagedResult<EventListDto>> SearchEventsAsync(
        string searchTerm,
        int pageNumber = 1,
        int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            throw new BadRequestException("Search term cannot be empty");
        }

        var pagedEvents = await _eventRepository.SearchEventsAsync(searchTerm, pageNumber, pageSize);
        var eventListDtos = pagedEvents.Items.Select(MapToEventListDto).ToList();

        return new PagedResult<EventListDto>(
            eventListDtos,
            pagedEvents.TotalCount,
            pagedEvents.PageNumber,
            pagedEvents.PageSize
        );
    }

    #endregion
}
