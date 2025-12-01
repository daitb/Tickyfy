using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<EventService> _logger;

    public EventService(
        IEventRepository eventRepository,
        ApplicationDbContext context,
        IEmailService emailService,
        ILogger<EventService> logger)
    {
        _eventRepository = eventRepository;
        _context = context;
        _emailService = emailService;
        _logger = logger;
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

    #region Organizer Operations (Create, Update, Publish, Duplicate)

    /// Create new event (Organizer only)
    public async Task<EventDetailDto> CreateEventAsync(CreateEventDto dto, int organizerId)
    {
        try
        {
            _logger.LogInformation("Starting CreateEventAsync for organizer {OrganizerId}", organizerId);

            // Validate organizer exists
            var organizer = await _context.Organizers
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == organizerId);

            _logger.LogInformation("Organizer lookup result: {Found}", organizer != null);

            if (organizer == null)
                throw new NotFoundException($"Organizer with ID {organizerId} not found");

            // Validate category exists
            _logger.LogInformation("Looking up category {CategoryId}", dto.CategoryId);
            var category = await _context.Categories.FindAsync(dto.CategoryId);
            _logger.LogInformation("Category lookup result: Found={Found}, Active={Active}", 
                category != null, category?.IsActive);

            if (category == null || !category.IsActive)
                throw new NotFoundException($"Category with ID {dto.CategoryId} not found or inactive");

            // Business validation
            _logger.LogInformation("Validating event dates: Start={Start}, End={End}", 
                dto.StartDate, dto.EndDate);
            ValidateEventDates(dto.StartDate, dto.EndDate);
            
            _logger.LogInformation("Validating ticket types: Count={Count}", dto.TicketTypes?.Count ?? 0);
            ValidateTicketTypes(dto.TicketTypes);

            // Create event entity
            _logger.LogInformation("Creating event entity");
            var eventEntity = new Event
            {
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                Location = dto.Venue.Trim(),
                Address = dto.Venue.Trim(),
                BannerImage = dto.ImageUrl,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                MaxCapacity = dto.TotalSeats,
                CategoryId = dto.CategoryId,
                OrganizerId = organizerId,
                Status = EventStatus.Pending, // Always Pending - requires admin approval
                CreatedAt = DateTime.UtcNow
            };
            
            _logger.LogInformation("Event status set to: {Status} (Value: {StatusValue})", 
                eventEntity.Status, (int)eventEntity.Status);

            // Add event to database
            _logger.LogInformation("Adding event to database");
            var createdEvent = await _eventRepository.AddAsync(eventEntity);
            _logger.LogInformation("Event created with ID {EventId}", createdEvent.Id);

            // Create ticket types if provided
            if (dto.TicketTypes != null && dto.TicketTypes.Any())
            {
                _logger.LogInformation("Creating {Count} ticket types", dto.TicketTypes.Count);
                foreach (var ticketTypeDto in dto.TicketTypes)
                {
                    var ticketType = new TicketType
                    {
                        EventId = createdEvent.Id,
                        Name = ticketTypeDto.TypeName.Trim(),
                        Description = ticketTypeDto.Description,
                        Price = ticketTypeDto.Price,
                        TotalQuantity = ticketTypeDto.Quantity,
                        AvailableQuantity = ticketTypeDto.Quantity,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.TicketTypes.Add(ticketType);
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Ticket types saved successfully");
            }

            // Send email notification to organizer
            _logger.LogInformation("Sending email notification to {Email}", organizer.User!.Email);
            try
            {
                await _emailService.SendEmailAsync(
                    organizer.User!.Email,
                    "Event Created Successfully",
                    $"<h2>Event Created: {eventEntity.Title}</h2>" +
                    $"<p>Your event has been created and is pending approval.</p>" +
                $"<p>We will review it and notify you once it's approved.</p>"
            );
                _logger.LogInformation("Email sent successfully");
            }
            catch (Exception emailEx)
            {
                // Email failure should not block event creation
                _logger.LogWarning(emailEx, "Failed to send email notification but event was created");
            }

            // Reload event with all related data
            _logger.LogInformation("Reloading event with related data");
            var fullEvent = await _eventRepository.GetByIdAsync(createdEvent.Id, includeRelated: true);
            _logger.LogInformation("CreateEventAsync completed successfully");
            return MapToEventDetailDto(fullEvent!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CreateEventAsync failed: {Message}", ex.Message);
            throw;
        }
    }

    /// Update existing event (Organizer/Admin only)
    public async Task<EventDetailDto> UpdateEventAsync(
        int id,
        UpdateEventDto dto,
        int userId,
        bool isAdmin = false)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {id} not found");

        // Authorization check (unless admin)
        if (!isAdmin)
        {
            var user = await _context.Users
                .Include(u => u.OrganizerProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user?.OrganizerProfile == null || user.OrganizerProfile.Id != eventEntity.OrganizerId)
                throw new ForbiddenException("You are not authorized to update this event");
        }

        // Check if event can be edited
        if (!await CanEditEventAsync(id))
            throw new BadRequestException("This event cannot be edited (already published or completed)");

        // Validate category exists
        var category = await _context.Categories.FindAsync(dto.CategoryId);
        if (category == null || !category.IsActive)
            throw new NotFoundException($"Category with ID {dto.CategoryId} not found or inactive");

        // Business validation
        ValidateEventDates(dto.StartDate, dto.EndDate);

        // Update event properties
        eventEntity.Title = dto.Title.Trim();
        eventEntity.Description = dto.Description.Trim();
        eventEntity.Location = dto.Venue.Trim();
        eventEntity.Address = dto.Venue.Trim();
        eventEntity.BannerImage = dto.ImageUrl;
        eventEntity.StartDate = dto.StartDate;
        eventEntity.EndDate = dto.EndDate;
        eventEntity.MaxCapacity = dto.TotalSeats;
        eventEntity.CategoryId = dto.CategoryId;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);

        // Reload with related data
        var updatedEvent = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        return MapToEventDetailDto(updatedEvent!);
    }

    /// Publish event - submit for admin approval (Organizer only)
    public async Task<EventDetailDto> PublishEventAsync(int id, int organizerId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {id} not found");

        // Verify ownership
        if (!await _eventRepository.IsOrganizerOwnerAsync(id, organizerId))
            throw new ForbiddenException("You are not authorized to publish this event");

        // Check current status
        if (eventEntity.Status != EventStatus.Pending)
            throw new BadRequestException($"Event cannot be published from status: {eventEntity.Status}");

        // Validate event has ticket types
        if (eventEntity.TicketTypes == null || !eventEntity.TicketTypes.Any())
            throw new BadRequestException("Event must have at least one ticket type before publishing");

        // Change status to Pending (waiting for admin approval)
        eventEntity.Status = EventStatus.Pending;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);

        // Notify admins (optional - could be done via background job)
        var updatedEvent = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        return MapToEventDetailDto(updatedEvent!);
    }

    /// Cancel event (Organizer/Admin)
    public async Task<bool> CancelEventAsync(int id, int userId, bool isAdmin, string? reason = null)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {id} not found");

        // Authorization check
        if (!isAdmin)
        {
            var user = await _context.Users
                .Include(u => u.OrganizerProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user?.OrganizerProfile == null || user.OrganizerProfile.Id != eventEntity.OrganizerId)
                throw new ForbiddenException("You are not authorized to cancel this event");
        }

        // Check if event can be cancelled
        if (eventEntity.Status == EventStatus.Cancelled || eventEntity.Status == EventStatus.Completed)
            throw new BadRequestException($"Event cannot be cancelled (current status: {eventEntity.Status})");

        // Update status
        eventEntity.Status = EventStatus.Cancelled;
        eventEntity.RejectionReason = reason ?? "Event cancelled by organizer";
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);

        // TODO: Trigger refunds for confirmed bookings
        // This should be done via background job (Hangfire)
        // await ProcessRefundsForCancelledEvent(id);

        // Send cancellation emails to ticket holders
        try
        {
            var confirmedBookings = await _context.Bookings
                .Include(b => b.User)
                .Where(b => b.EventId == id && b.Status == BookingStatus.Confirmed)
                .ToListAsync();

            foreach (var booking in confirmedBookings)
            {
                await _emailService.SendEmailAsync(
                    booking.User!.Email,
                    $"Event Cancelled: {eventEntity.Title}",
                    $"<h2>Event Cancellation Notice</h2>" +
                    $"<p>We regret to inform you that the event <strong>{eventEntity.Title}</strong> has been cancelled.</p>" +
                    $"<p>Reason: {eventEntity.RejectionReason}</p>" +
                    $"<p>A refund will be processed to your original payment method within 5-7 business days.</p>"
                );
            }
        }
        catch (Exception)
        {
            // Email failure should not block cancellation
        }

        return true;
    }

    /// Duplicate event (create copy with new dates)
    public async Task<EventDetailDto> DuplicateEventAsync(int id, int organizerId)
    {
        var originalEvent = await _eventRepository.GetByIdAsync(id, includeRelated: true);

        if (originalEvent == null)
            throw new NotFoundException($"Event with ID {id} not found");

        // Verify ownership
        if (!await _eventRepository.IsOrganizerOwnerAsync(id, organizerId))
            throw new ForbiddenException("You are not authorized to duplicate this event");

        // Create duplicated event
        var duplicatedEvent = new Event
        {
            Title = $"{originalEvent.Title} (Copy)",
            Description = originalEvent.Description,
            Location = originalEvent.Location,
            Address = originalEvent.Address,
            BannerImage = originalEvent.BannerImage,
            MaxCapacity = originalEvent.MaxCapacity,
            MinimumAge = originalEvent.MinimumAge,
            CategoryId = originalEvent.CategoryId,
            OrganizerId = organizerId,
            Status = EventStatus.Pending, // Start as draft
            StartDate = DateTime.UtcNow.AddDays(30), // Default: 30 days from now
            EndDate = DateTime.UtcNow.AddDays(30).AddHours(
                (originalEvent.EndDate - originalEvent.StartDate).TotalHours
            ),
            CreatedAt = DateTime.UtcNow
        };

        var createdEvent = await _eventRepository.AddAsync(duplicatedEvent);

        // Duplicate ticket types
        if (originalEvent.TicketTypes != null && originalEvent.TicketTypes.Any())
        {
            foreach (var originalTicketType in originalEvent.TicketTypes)
            {
                var newTicketType = new TicketType
                {
                    EventId = createdEvent.Id,
                    Name = originalTicketType.Name,
                    Description = originalTicketType.Description,
                    Price = originalTicketType.Price,
                    TotalQuantity = originalTicketType.TotalQuantity,
                    AvailableQuantity = originalTicketType.TotalQuantity,
                    Zone = originalTicketType.Zone,
                    HasSeatSelection = originalTicketType.HasSeatSelection,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.TicketTypes.Add(newTicketType);
            }

            await _context.SaveChangesAsync();
        }

        // Reload with related data
        var fullEvent = await _eventRepository.GetByIdAsync(createdEvent.Id, includeRelated: true);
        return MapToEventDetailDto(fullEvent!);
    }

    #endregion

    #region Admin Operations (Approve, Reject, Delete)

    /// Approve event (Admin only) - changes status to Approved
    public async Task<EventDetailDto> ApproveEventAsync(int id, int adminId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {id} not found");

        // Check if event is in Pending status
        if (eventEntity.Status != EventStatus.Pending)
            throw new BadRequestException($"Only pending events can be approved (current status: {eventEntity.Status})");

        // Update event status
        eventEntity.Status = EventStatus.Approved;
        eventEntity.ApprovedByStaffId = adminId;
        eventEntity.ApprovedAt = DateTime.UtcNow;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);

        // Send approval email to organizer
        try
        {
            var organizer = await _context.Organizers
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == eventEntity.OrganizerId);

            if (organizer?.User != null)
            {
                await _emailService.SendEmailAsync(
                    organizer.User.Email,
                    $"Event Approved: {eventEntity.Title}",
                    $"<h2>Great News!</h2>" +
                    $"<p>Your event <strong>{eventEntity.Title}</strong> has been approved!</p>" +
                    $"<p>It is now live and visible to users.</p>" +
                    $"<p>Event Date: {eventEntity.StartDate:MMMM dd, yyyy}</p>"
                );
            }
        }
        catch (Exception)
        {
            // Email failure should not block approval
        }

        var approvedEvent = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        return MapToEventDetailDto(approvedEvent!);
    }

    /// Reject event (Admin only) - changes status to Rejected
    public async Task<EventDetailDto> RejectEventAsync(int id, int adminId, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new BadRequestException("Rejection reason is required");

        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {id} not found");

        // Check if event is in Pending status
        if (eventEntity.Status != EventStatus.Pending)
            throw new BadRequestException($"Only pending events can be rejected (current status: {eventEntity.Status})");

        // Update event status
        eventEntity.Status = EventStatus.Rejected;
        eventEntity.RejectionReason = reason.Trim();
        eventEntity.ApprovedByStaffId = adminId; // Track who rejected it
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);

        // Send rejection email to organizer
        try
        {
            var organizer = await _context.Organizers
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == eventEntity.OrganizerId);

            if (organizer?.User != null)
            {
                await _emailService.SendEmailAsync(
                    organizer.User.Email,
                    $"Event Rejected: {eventEntity.Title}",
                    $"<h2>Event Review Update</h2>" +
                    $"<p>Unfortunately, your event <strong>{eventEntity.Title}</strong> has been rejected.</p>" +
                    $"<p><strong>Reason:</strong> {reason}</p>" +
                    $"<p>You can edit the event and resubmit it for approval.</p>"
                );
            }
        }
        catch (Exception)
        {
            // Email failure should not block rejection
        }

        var rejectedEvent = await _eventRepository.GetByIdAsync(id, includeRelated: true);
        return MapToEventDetailDto(rejectedEvent!);
    }

    /// Delete event (Admin only) - soft delete
    public async Task<bool> DeleteEventAsync(int id)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {id} not found");

        // Check if event has confirmed bookings
        var hasConfirmedBookings = await _context.Bookings
            .AnyAsync(b => b.EventId == id && b.Status == BookingStatus.Confirmed);

        if (hasConfirmedBookings)
            throw new BadRequestException("Cannot delete event with confirmed bookings. Please cancel the event instead.");

        // Soft delete (changes status to Cancelled)
        return await _eventRepository.DeleteAsync(id);
    }

    #endregion

    #region Statistics

    /// Get event statistics (sales, revenue, attendance)
    public async Task<EventStatsDto> GetEventStatisticsAsync(int id, int userId, bool isAdmin)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeRelated: true);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {id} not found");

        // Authorization check (organizer or admin)
        if (!isAdmin)
        {
            var user = await _context.Users
                .Include(u => u.OrganizerProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user?.OrganizerProfile == null || user.OrganizerProfile.Id != eventEntity.OrganizerId)
                throw new ForbiddenException("You are not authorized to view statistics for this event");
        }

        // Calculate statistics
        var confirmedBookings = eventEntity.Bookings?
            .Where(b => b.Status == BookingStatus.Confirmed)
            .ToList() ?? new List<Booking>();

        var totalTicketsSold = confirmedBookings
            .Sum(b => b.Tickets?.Count ?? 0);

        var totalRevenue = confirmedBookings
            .Sum(b => b.TotalAmount);

        var totalSeats = eventEntity.TicketTypes?
            .Sum(tt => tt.TotalQuantity) ?? 0;

        var availableSeats = eventEntity.TicketTypes?
            .Sum(tt => tt.AvailableQuantity) ?? 0;

        // Review statistics
        var reviews = eventEntity.Reviews?.ToList() ?? new List<Review>();
        var avgRating = reviews.Any() ? (decimal)reviews.Average(r => r.Rating) : 0m;

        // Attendance statistics (for completed events)
        int? totalAttendees = null;
        decimal? attendanceRate = null;

        if (eventEntity.Status == EventStatus.Completed)
        {
            var ticketIds = confirmedBookings
                .SelectMany(b => b.Tickets?.Select(t => t.Id) ?? new List<int>())
                .ToList();

            totalAttendees = await _context.TicketScans
                .Where(ts => ticketIds.Contains(ts.TicketId))
                .Select(ts => ts.TicketId)
                .Distinct()
                .CountAsync();

            if (totalTicketsSold > 0)
                attendanceRate = (decimal)totalAttendees / totalTicketsSold * 100;
        }

        // Ticket type breakdown
        var ticketTypeSales = eventEntity.TicketTypes?
            .Select(tt => new TicketTypeSalesDto
            {
                TicketTypeId = tt.Id,
                TypeName = tt.Name,
                Price = tt.Price,
                TotalQuantity = tt.TotalQuantity,
                SoldQuantity = tt.TotalQuantity - tt.AvailableQuantity,
                AvailableQuantity = tt.AvailableQuantity,
                Revenue = (tt.TotalQuantity - tt.AvailableQuantity) * tt.Price,
                SalesPercentage = tt.TotalQuantity > 0
                    ? (decimal)(tt.TotalQuantity - tt.AvailableQuantity) / tt.TotalQuantity * 100
                    : 0
            })
            .ToList() ?? new List<TicketTypeSalesDto>();

        return new EventStatsDto
        {
            EventId = eventEntity.Id,
            EventTitle = eventEntity.Title,
            TotalBookings = confirmedBookings.Count,
            TotalTicketsSold = totalTicketsSold,
            TotalSeats = totalSeats,
            AvailableSeats = availableSeats,
            SalesPercentage = totalSeats > 0 ? (decimal)(totalSeats - availableSeats) / totalSeats * 100 : 0,
            TotalRevenue = totalRevenue,
            AverageOrderValue = confirmedBookings.Any() ? totalRevenue / confirmedBookings.Count : 0,
            AverageRating = avgRating,
            TotalReviews = reviews.Count,
            TotalAttendees = totalAttendees,
            AttendanceRate = attendanceRate,
            TicketTypeSales = ticketTypeSales,
            FirstSaleDate = confirmedBookings.Any()
                ? confirmedBookings.Min(b => b.BookingDate)
                : null,
            LastSaleDate = confirmedBookings.Any()
                ? confirmedBookings.Max(b => b.BookingDate)
                : null
        };
    }

    #endregion

    #region Validation Helpers

    /// Check if organizer owns the event
    public async Task<bool> IsOrganizerOwnerAsync(int eventId, int organizerId)
    {
        return await _eventRepository.IsOrganizerOwnerAsync(eventId, organizerId);
    }

    /// Check if event can be edited
    public async Task<bool> CanEditEventAsync(int eventId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);

        if (eventEntity == null)
            return false;

        // Can only edit Pending or Rejected events
        return eventEntity.Status == EventStatus.Pending ||
               eventEntity.Status == EventStatus.Rejected;
    }

    /// Check if event can be canceled
    public async Task<bool> CanCancelEventAsync(int eventId)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);

        if (eventEntity == null)
            return false;

        // Cannot cancel if already cancelled or completed
        return eventEntity.Status != EventStatus.Cancelled &&
               eventEntity.Status != EventStatus.Completed;
    }

    #endregion

    #region Private Helper Methods

    /// Validate event dates (start date must be before end date)
    /// <summary>
    /// Strict validation for event dates - prevents past events and enforces 24-hour advance booking
    /// </summary>
    private void ValidateEventDates(DateTime startDate, DateTime endDate)
    {
        var now = DateTime.UtcNow;
        
        // Check if start date is in the past
        if (startDate < now)
            throw new BadRequestException(
                $"Event start date cannot be in the past. " +
                $"Selected: {startDate:yyyy-MM-dd HH:mm} UTC, Current: {now:yyyy-MM-dd HH:mm} UTC");

        // Enforce minimum 24-hour advance booking (best practice for event management)
        var minimumStartDate = now.AddHours(24);
        if (startDate < minimumStartDate)
            throw new BadRequestException(
                $"Events must be scheduled at least 24 hours in advance. " +
                $"Minimum allowed: {minimumStartDate:yyyy-MM-dd HH:mm} UTC");

        // Validate end date is after start date
        if (startDate >= endDate)
            throw new BadRequestException(
                "Event end date must be after start date. " +
                $"Start: {startDate:yyyy-MM-dd HH:mm}, End: {endDate:yyyy-MM-dd HH:mm}");

        // Prevent extremely long events (sanity check - max 30 days)
        var maxDuration = TimeSpan.FromDays(30);
        if (endDate - startDate > maxDuration)
            throw new BadRequestException(
                $"Event duration cannot exceed 30 days. Current duration: {(endDate - startDate).TotalDays:F1} days");
    }

    /// Validate ticket types
    private void ValidateTicketTypes(List<CreateTicketTypeDto>? ticketTypes)
    {
        if (ticketTypes == null || !ticketTypes.Any())
            return; // Ticket types are optional during creation

        foreach (var tt in ticketTypes)
        {
            if (tt.Price < 0)
                throw new BadRequestException($"Ticket type '{tt.TypeName}' has invalid price");

            if (tt.Quantity <= 0)
                throw new BadRequestException($"Ticket type '{tt.TypeName}' must have at least 1 ticket");
        }
    }

    /// Map Event entity to EventDetailDto
    private EventDetailDto MapToEventDetailDto(Event eventEntity)
    {
        return new EventDetailDto
        {
            EventId = eventEntity.Id,
            Title = eventEntity.Title,
            Description = eventEntity.Description,
            Venue = eventEntity.Location,
            ImageUrl = eventEntity.BannerImage,
            StartDate = eventEntity.StartDate,
            EndDate = eventEntity.EndDate,
            TotalSeats = eventEntity.MaxCapacity ?? 0,
            AvailableSeats = eventEntity.TicketTypes?.Sum(tt => tt.AvailableQuantity) ?? 0,
            IsFeatured = false, // TODO: Add IsFeatured to Event model
            Status = eventEntity.Status.ToString(),
            CategoryId = eventEntity.CategoryId,
            CategoryName = eventEntity.Category?.Name ?? "",
            OrganizerId = eventEntity.OrganizerId,
            OrganizerName = eventEntity.Organizer?.CompanyName ?? "",
            OrganizerEmail = eventEntity.Organizer?.CompanyEmail,
            TicketTypes = eventEntity.TicketTypes?
                .Select(tt => new TicketTypeDto
                {
                    TicketTypeId = tt.Id,
                    TypeName = tt.Name,
                    Price = tt.Price,
                    Quantity = tt.TotalQuantity,
                    AvailableQuantity = tt.AvailableQuantity,
                    Description = tt.Description
                })
                .ToList() ?? new List<TicketTypeDto>(),
            TotalBookings = eventEntity.Bookings?.Count(b => b.Status == BookingStatus.Confirmed) ?? 0,
            AverageRating = eventEntity.Reviews?.Any() == true
                ? (decimal)eventEntity.Reviews.Average(r => r.Rating)
                : 0m,
            TotalReviews = eventEntity.Reviews?.Count ?? 0,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt
        };
    }

    /// Map Event entity to EventListDto (for listing)
    private EventListDto MapToEventListDto(Event eventEntity)
    {
        return new EventListDto
        {
            EventId = eventEntity.Id,
            Title = eventEntity.Title,
            Venue = eventEntity.Location,
            ImageUrl = eventEntity.BannerImage,
            StartDate = eventEntity.StartDate,
            EndDate = eventEntity.EndDate,
            CategoryName = eventEntity.Category?.Name ?? "",
            OrganizerName = eventEntity.Organizer?.CompanyName ?? "",
            AvailableSeats = eventEntity.TicketTypes?.Sum(tt => tt.AvailableQuantity) ?? 0,
            MinPrice = eventEntity.TicketTypes?.Any() == true
                ? eventEntity.TicketTypes.Min(tt => tt.Price)
                : 0,
            MaxPrice = eventEntity.TicketTypes?.Any() == true
                ? eventEntity.TicketTypes.Max(tt => tt.Price)
                : 0,
            IsFeatured = false, // TODO: Add to Event model
            Status = eventEntity.Status.ToString()
        };
    }

    /// Map Event entity to EventCardDto (minimal for cards)
    private EventCardDto MapToEventCardDto(Event eventEntity)
    {
        return new EventCardDto
        {
            EventId = eventEntity.Id,
            Title = eventEntity.Title,
            ImageUrl = eventEntity.BannerImage,
            StartDate = eventEntity.StartDate,
            Venue = eventEntity.Location,
            CategoryName = eventEntity.Category?.Name ?? "",
            MinPrice = eventEntity.TicketTypes?.Any() == true
                ? eventEntity.TicketTypes.Min(tt => tt.Price)
                : 0,
            AvailableSeats = eventEntity.TicketTypes?.Sum(tt => tt.AvailableQuantity) ?? 0,
            IsFeatured = false // TODO: Add to Event model
        };
    }

    #endregion
}
