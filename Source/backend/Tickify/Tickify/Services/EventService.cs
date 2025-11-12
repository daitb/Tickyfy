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

    #region CRUD Operations (Authentication Required)

    /// Create a new event
    public async Task<EventDetailDto> CreateEventAsync(CreateEventDto dto, int organizerId)
    {
        // Validate organizer exists and is verified
        var organizer = await _context.Organizers.FindAsync(organizerId);
        if (organizer == null)
            throw new NotFoundException("Organizer not found");

        if (!organizer.IsVerified)
            throw new BadRequestException("Organizer must be verified to create events");

        // Create event entity
        var eventEntity = new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Venue, // Map Venue to Location
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MaxCapacity = dto.TotalSeats,
            OrganizerId = organizerId,
            CategoryId = dto.CategoryId,
            Status = EventStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add ticket types
        if (dto.TicketTypes != null)
        {
            foreach (var ticketTypeDto in dto.TicketTypes)
            {
                var ticketType = new TicketType
                {
                    Name = ticketTypeDto.TypeName,
                    Description = ticketTypeDto.Description,
                    Price = ticketTypeDto.Price,
                    TotalQuantity = ticketTypeDto.Quantity,
                    AvailableQuantity = ticketTypeDto.Quantity,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                eventEntity.TicketTypes ??= new List<TicketType>();
                eventEntity.TicketTypes.Add(ticketType);
            }
        }

        // Save to database
        await _eventRepository.AddAsync(eventEntity);
        await _context.SaveChangesAsync();

        // Send notification email to organizer
        try
        {
            if (organizer.User != null)
            {
                await _emailService.SendEmailFromTemplateAsync(
                    organizer.User.Email,
                    $"Event Created: {eventEntity.Title}",
                    "event-created",
                    new Dictionary<string, string>
                    {
                        { "EventTitle", eventEntity.Title },
                        { "EventDate", eventEntity.StartDate.ToString("MMMM dd, yyyy") },
                        { "OrganizerName", organizer.User.FullName }
                    });
            }
        }
        catch (Exception ex)
        {
            // Log error but don't fail the operation
            Console.WriteLine($"Failed to send event creation email: {ex.Message}");
        }

        return MapToEventDetailDto(eventEntity);
    }

    /// Update an existing event
    public async Task<EventDetailDto> UpdateEventAsync(int id, UpdateEventDto dto, int userId, bool isAdmin = false)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        if (eventEntity == null)
            throw new NotFoundException("Event not found");

        // Check permissions
        if (!isAdmin && eventEntity.OrganizerId != userId)
            throw new ForbiddenException("You don't have permission to update this event");

        // Check if event can be edited
        if (!await CanEditEventAsync(id))
            throw new BadRequestException("Event cannot be edited at this stage");

        // Update basic info
        eventEntity.Title = dto.Title;
        eventEntity.Description = dto.Description;
        eventEntity.Location = dto.Venue; // Map Venue to Location
        eventEntity.StartDate = dto.StartDate;
        eventEntity.EndDate = dto.EndDate;
        eventEntity.MaxCapacity = dto.TotalSeats;
        eventEntity.CategoryId = dto.CategoryId;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);
        await _context.SaveChangesAsync();

        return MapToEventDetailDto(eventEntity);
    }

    /// Publish an event (Organizer only)
    public async Task<EventDetailDto> PublishEventAsync(int id, int organizerId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        if (eventEntity == null)
            throw new NotFoundException("Event not found");

        // Check ownership
        if (eventEntity.OrganizerId != organizerId)
            throw new ForbiddenException("You don't have permission to publish this event");

        // Validate event can be published
        if (eventEntity.Status != EventStatus.Pending)
            throw new BadRequestException("Only pending events can be published");

        if (eventEntity.TicketTypes == null || !eventEntity.TicketTypes.Any())
            throw new BadRequestException("Event must have at least one ticket type");

        if (eventEntity.StartDate <= DateTime.UtcNow)
            throw new BadRequestException("Event start date must be in the future");

        // Update status
        eventEntity.Status = EventStatus.Approved;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);
        await _context.SaveChangesAsync();

        // Send approval notification to organizer
        try
        {
            if (eventEntity.Organizer != null && eventEntity.Organizer.User != null)
            {
                await _emailService.SendEmailFromTemplateAsync(
                    eventEntity.Organizer.User.Email,
                    $"Event Published: {eventEntity.Title}",
                    "event-published",
                    new Dictionary<string, string>
                    {
                        { "EventTitle", eventEntity.Title },
                        { "EventDate", eventEntity.StartDate.ToString("MMMM dd, yyyy") },
                        { "OrganizerName", eventEntity.Organizer.User.FullName }
                    });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send publish notification: {ex.Message}");
        }

        return MapToEventDetailDto(eventEntity);
    }

    /// Cancel an event
    public async Task<bool> CancelEventAsync(int id, int userId, bool isAdmin, string? reason = null)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        if (eventEntity == null)
            throw new NotFoundException("Event not found");

        // Check permissions
        if (!isAdmin && eventEntity.OrganizerId != userId)
            throw new ForbiddenException("You don't have permission to cancel this event");

        // Check if event can be cancelled
        if (!await CanCancelEventAsync(id))
            throw new BadRequestException("Event cannot be cancelled at this stage");

        // Cancel event
        eventEntity.Status = EventStatus.Cancelled;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        // Cancel all related bookings
        var bookings = await _context.Bookings
            .Where(b => b.Tickets != null && b.Tickets.Any(t => t.TicketType != null && t.TicketType.EventId == id))
            .Include(b => b.Tickets)
            .ToListAsync();

        foreach (var booking in bookings)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = reason ?? "Event cancelled by organizer";
        }

        await _eventRepository.UpdateAsync(eventEntity);
        await _context.SaveChangesAsync();

        // Send cancellation emails
        try
        {
            foreach (var booking in bookings.Where(b => b.User != null))
            {
                await _emailService.SendEmailFromTemplateAsync(
                    booking.User!.Email,
                    $"Event Cancelled: {eventEntity.Title}",
                    "event-cancelled",
                    new Dictionary<string, string>
                    {
                        { "EventTitle", eventEntity.Title },
                        { "CancellationReason", reason ?? "Event cancelled by organizer" },
                        { "UserName", booking.User.FullName }
                    });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send cancellation emails: {ex.Message}");
        }

        return true;
    }

    /// Duplicate an event
    public async Task<EventDetailDto> DuplicateEventAsync(int id, int organizerId)
    {
        var originalEvent = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        if (originalEvent == null)
            throw new NotFoundException("Event not found");

        // Check ownership
        if (originalEvent.OrganizerId != organizerId)
            throw new ForbiddenException("You don't have permission to duplicate this event");

        // Create duplicate
        var duplicatedEvent = new Event
        {
            Title = $"{originalEvent.Title} (Copy)",
            Description = originalEvent.Description,
            Location = originalEvent.Location,
            Address = originalEvent.Address,
            StartDate = originalEvent.StartDate.AddDays(7), // Default to 1 week later
            EndDate = originalEvent.EndDate.AddDays(7),
            MaxCapacity = originalEvent.MaxCapacity,
            OrganizerId = organizerId,
            CategoryId = originalEvent.CategoryId,
            Status = EventStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Duplicate ticket types
        if (originalEvent.TicketTypes != null)
        {
            foreach (var ticketType in originalEvent.TicketTypes)
            {
                var duplicatedTicketType = new TicketType
                {
                    Name = ticketType.Name,
                    Description = ticketType.Description,
                    Price = ticketType.Price,
                    TotalQuantity = ticketType.TotalQuantity,
                    AvailableQuantity = ticketType.TotalQuantity,
                    Zone = ticketType.Zone,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                duplicatedEvent.TicketTypes ??= new List<TicketType>();
                duplicatedEvent.TicketTypes.Add(duplicatedTicketType);
            }
        }

        await _eventRepository.AddAsync(duplicatedEvent);
        await _context.SaveChangesAsync();

        return MapToEventDetailDto(duplicatedEvent);
    }

    /// Approve event (Admin only)
    public async Task<EventDetailDto> ApproveEventAsync(int id, int adminId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        if (eventEntity == null)
            throw new NotFoundException("Event not found");

        // Check admin permission
        var adminUser = await _context.Users.FindAsync(adminId);
        if (adminUser == null || !adminUser.UserRoles.Any(ur => ur.Role.Name == "Admin"))
            throw new ForbiddenException("Admin access required");

        if (eventEntity.Status != EventStatus.Pending)
            throw new BadRequestException("Only pending events can be approved");

        // Approve event
        eventEntity.Status = EventStatus.Approved;
        eventEntity.ApprovedAt = DateTime.UtcNow;
        eventEntity.ApprovedByStaffId = adminId;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);
        await _context.SaveChangesAsync();

        // Send approval notification to organizer
        try
        {
            if (eventEntity.Organizer != null && eventEntity.Organizer.User != null)
            {
                await _emailService.SendEmailFromTemplateAsync(
                    eventEntity.Organizer.User.Email,
                    $"Event Approved: {eventEntity.Title}",
                    "event-approved",
                    new Dictionary<string, string>
                    {
                        { "EventTitle", eventEntity.Title },
                        { "EventDate", eventEntity.StartDate.ToString("MMMM dd, yyyy") },
                        { "OrganizerName", eventEntity.Organizer.User.FullName }
                    });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send approval email: {ex.Message}");
        }

        return MapToEventDetailDto(eventEntity);
    }

    /// Reject event (Admin only)
    public async Task<EventDetailDto> RejectEventAsync(int id, int adminId, string reason)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        if (eventEntity == null)
            throw new NotFoundException("Event not found");

        // Check admin permission
        var adminUser = await _context.Users.FindAsync(adminId);
        if (adminUser == null || !adminUser.UserRoles.Any(ur => ur.Role.Name == "Admin"))
            throw new ForbiddenException("Admin access required");

        if (eventEntity.Status != EventStatus.Pending)
            throw new BadRequestException("Only pending events can be rejected");

        if (string.IsNullOrWhiteSpace(reason))
            throw new BadRequestException("Rejection reason is required");

        // Reject event
        eventEntity.Status = EventStatus.Rejected;
        eventEntity.RejectionReason = reason;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);
        await _context.SaveChangesAsync();

        // Send rejection notification to organizer
        try
        {
            if (eventEntity.Organizer != null && eventEntity.Organizer.User != null)
            {
                await _emailService.SendEmailFromTemplateAsync(
                    eventEntity.Organizer.User.Email,
                    $"Event Rejected: {eventEntity.Title}",
                    "event-rejected",
                    new Dictionary<string, string>
                    {
                        { "EventTitle", eventEntity.Title },
                        { "RejectionReason", reason },
                        { "OrganizerName", eventEntity.Organizer.User.FullName }
                    });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send rejection email: {ex.Message}");
        }

        return MapToEventDetailDto(eventEntity);
    }

    /// Delete event (Admin only)
    public async Task<bool> DeleteEventAsync(int id)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);
        if (eventEntity == null)
            throw new NotFoundException("Event not found");

        // Only allow deletion of draft or rejected events
        if (eventEntity.Status != EventStatus.Pending && eventEntity.Status != EventStatus.Rejected)
            throw new BadRequestException("Only pending or rejected events can be deleted");

        await _eventRepository.DeleteAsync(id);
        await _context.SaveChangesAsync();

        return true;
    }

    #endregion

    #region Statistics and Analytics

    /// Get event statistics
    public async Task<EventStatsDto> GetEventStatisticsAsync(int id, int userId, bool isAdmin)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        if (eventEntity == null)
            throw new NotFoundException("Event not found");

        // Check permissions
        if (!isAdmin && eventEntity.OrganizerId != userId)
            throw new ForbiddenException("You don't have permission to view these statistics");

        var stats = new EventStatsDto
        {
            EventId = eventEntity.Id,
            EventTitle = eventEntity.Title
        };

        // Get all ticket types for this event
        var ticketTypes = eventEntity.TicketTypes?.ToList() ?? new List<TicketType>();
        stats.TotalSeats = ticketTypes.Sum(tt => tt.TotalQuantity);

        // Get all bookings and tickets
        var bookings = await _context.Bookings
            .Where(b => b.Tickets != null && b.Tickets.Any(t => t.TicketType != null && t.TicketType.EventId == id))
            .Include(b => b.Tickets)
            .ToListAsync();

        stats.TotalBookings = bookings.Count;
        stats.TotalTicketsSold = bookings.Sum(b => b.Tickets?.Count ?? 0);
        stats.AvailableSeats = stats.TotalSeats - stats.TotalTicketsSold;
        stats.SalesPercentage = stats.TotalSeats > 0 ? (decimal)stats.TotalTicketsSold / stats.TotalSeats * 100 : 0;

        // Revenue calculations
        stats.TotalRevenue = bookings
            .Where(b => b.Status == BookingStatus.Confirmed)
            .Sum(b => b.TotalAmount);

        stats.AverageOrderValue = stats.TotalBookings > 0 ? stats.TotalRevenue / stats.TotalBookings : 0;

        // Review statistics
        var reviews = await _context.Reviews
            .Where(r => r.EventId == id)
            .ToListAsync();

        stats.TotalReviews = reviews.Count;
        stats.AverageRating = reviews.Any() ? (decimal)reviews.Average(r => r.Rating) : 0;

        // Attendance (for completed events)
        if (eventEntity.Status == EventStatus.Completed)
        {
            var scannedTickets = await _context.TicketScans
                .Where(ts => ts.Ticket != null && ts.Ticket.TicketType != null && ts.Ticket.TicketType.EventId == id)
                .CountAsync();

            stats.TotalAttendees = scannedTickets;
            stats.AttendanceRate = stats.TotalTicketsSold > 0 ? (decimal)scannedTickets / stats.TotalTicketsSold * 100 : 0;
        }

        // Ticket type breakdown
        foreach (var ticketType in ticketTypes)
        {
            var soldForType = bookings.Sum(b => b.Tickets?.Count(t => t.TicketTypeId == ticketType.Id) ?? 0);

            stats.TicketTypeSales.Add(new TicketTypeSalesDto
            {
                TicketTypeId = ticketType.Id,
                TypeName = ticketType.Name,
                Price = ticketType.Price,
                TotalQuantity = ticketType.TotalQuantity,
                SoldQuantity = soldForType,
                AvailableQuantity = ticketType.TotalQuantity - soldForType,
                Revenue = soldForType * ticketType.Price,
                SalesPercentage = ticketType.TotalQuantity > 0 ? (decimal)soldForType / ticketType.TotalQuantity * 100 : 0
            });
        }

        // Time-based sales
        var firstBooking = bookings.OrderBy(b => b.BookingDate).FirstOrDefault();
        var lastBooking = bookings.OrderByDescending(b => b.BookingDate).FirstOrDefault();

        stats.FirstSaleDate = firstBooking?.BookingDate;
        stats.LastSaleDate = lastBooking?.BookingDate;

        return stats;
    }

    #endregion

    #region Permission Checks

    /// Check if user is the organizer of the event
    public async Task<bool> IsOrganizerOwnerAsync(int eventId, int organizerId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);
        return eventEntity?.OrganizerId == organizerId;
    }

    /// Check if event can be edited
    public async Task<bool> CanEditEventAsync(int eventId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);
        if (eventEntity == null) return false;

        // Can edit if pending or rejected
        return eventEntity.Status == EventStatus.Pending || eventEntity.Status == EventStatus.Rejected;
    }

    /// Check if event can be cancelled
    public async Task<bool> CanCancelEventAsync(int eventId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);
        if (eventEntity == null) return false;

        // Cannot cancel if already completed, cancelled, or in progress
        if (eventEntity.Status == EventStatus.Completed ||
            eventEntity.Status == EventStatus.Cancelled ||
            eventEntity.StartDate <= DateTime.UtcNow)
            return false;

        return true;
    }

    #endregion

    #region Private Helper Methods

    private EventListDto MapToEventListDto(Event eventEntity)
    {
        return new EventListDto
        {
            EventId = eventEntity.Id,
            Title = eventEntity.Title,
            Venue = eventEntity.Location,
            StartDate = eventEntity.StartDate,
            EndDate = eventEntity.EndDate,
            Status = eventEntity.Status.ToString(),
            OrganizerName = eventEntity.Organizer?.CompanyName ?? "Unknown",
            CategoryName = eventEntity.Category?.Name ?? "Uncategorized",
            AvailableSeats = eventEntity.TicketTypes?.Sum(tt => tt.AvailableQuantity) ?? 0,
            MinPrice = eventEntity.TicketTypes?.Min(tt => tt.Price) ?? 0,
            IsFeatured = false // TODO: Add IsFeatured to Event model
        };
    }

    private EventDetailDto MapToEventDetailDto(Event eventEntity)
    {
        return new EventDetailDto
        {
            EventId = eventEntity.Id,
            Title = eventEntity.Title,
            Description = eventEntity.Description,
            Venue = eventEntity.Location,
            StartDate = eventEntity.StartDate,
            EndDate = eventEntity.EndDate,
            Status = eventEntity.Status.ToString(),
            TotalSeats = eventEntity.MaxCapacity ?? 0,
            AvailableSeats = eventEntity.TicketTypes?.Sum(tt => tt.AvailableQuantity) ?? 0,
            IsFeatured = false, // TODO: Add IsFeatured to Event model
            CategoryId = eventEntity.CategoryId,
            CategoryName = eventEntity.Category?.Name ?? "Uncategorized",
            OrganizerId = eventEntity.OrganizerId,
            OrganizerName = eventEntity.Organizer?.CompanyName ?? "Unknown",
            TicketTypes = eventEntity.TicketTypes?.Select(tt => new TicketTypeDto
            {
                TicketTypeId = tt.Id,
                TypeName = tt.Name,
                Price = tt.Price,
                Quantity = tt.TotalQuantity,
                AvailableQuantity = tt.AvailableQuantity,
                Description = tt.Description
            }).ToList() ?? new List<TicketTypeDto>(),
            TotalBookings = 0, // TODO: Calculate from bookings
            AverageRating = 0, // TODO: Calculate from reviews
            TotalReviews = 0, // TODO: Calculate from reviews
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt
        };
    }

    private EventCardDto MapToEventCardDto(Event eventEntity)
    {
        return new EventCardDto
        {
            EventId = eventEntity.Id,
            Title = eventEntity.Title,
            StartDate = eventEntity.StartDate,
            Venue = eventEntity.Location,
            CategoryName = eventEntity.Category?.Name ?? "Uncategorized",
            MinPrice = eventEntity.TicketTypes?.Min(tt => tt.Price) ?? 0,
            AvailableSeats = eventEntity.TicketTypes?.Sum(tt => tt.AvailableQuantity) ?? 0,
            IsFeatured = false // TODO: Add IsFeatured to Event model
        };
    }

    #endregion
}
