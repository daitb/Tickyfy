using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Waitlist;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services;

public class WaitlistService : IWaitlistService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WaitlistService> _logger;

    public WaitlistService(ApplicationDbContext context, ILogger<WaitlistService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<WaitlistDto>> GetMyWaitlistEntriesAsync(int userId)
    {
        var entries = await _context.Waitlists
            .Include(w => w.Event)
            .Include(w => w.TicketType)
            .Include(w => w.User)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.JoinedAt)
            .ToListAsync();

        var result = new List<WaitlistDto>();

        foreach (var entry in entries)
        {
            // Calculate position in queue
            var position = await _context.Waitlists
                .Where(w => w.EventId == entry.EventId
                    && (entry.TicketTypeId == null || w.TicketTypeId == entry.TicketTypeId)
                    && w.JoinedAt < entry.JoinedAt
                    && !w.HasPurchased)
                .CountAsync() + 1;

            // Determine status
            var status = GetWaitlistStatus(entry);

            result.Add(new WaitlistDto
            {
                WaitlistId = entry.Id,
                UserId = entry.UserId,
                UserName = entry.User?.FullName ?? "",
                UserEmail = entry.User?.Email ?? "",
                EventId = entry.EventId,
                EventTitle = entry.Event?.Title ?? "",
                EventBanner = entry.Event?.BannerImage,
                EventDate = entry.Event?.StartDate ?? DateTime.MinValue,
                EventLocation = entry.Event?.Location,
                TicketTypeId = entry.TicketTypeId,
                TicketTypeName = entry.TicketType?.Name,
                RequestedQuantity = entry.RequestedQuantity,
                Status = status,
                IsNotified = entry.IsNotified,
                NotifiedAt = entry.NotifiedAt,
                ExpiresAt = entry.ExpiresAt,
                HasPurchased = entry.HasPurchased,
                JoinedAt = entry.JoinedAt,
                Position = position
            });
        }

        return result;
    }

    public async Task<WaitlistDto> JoinWaitlistAsync(int userId, JoinWaitlistDto dto)
    {
        _logger.LogInformation("JoinWaitlistAsync called - UserId: {UserId}, EventId: {EventId}, RequestedQuantity: {Quantity}",
            userId, dto.EventId, dto.RequestedQuantity);

        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == dto.EventId);

        if (eventEntity == null)
        {
            _logger.LogWarning("Event {EventId} not found", dto.EventId);
            throw new NotFoundException("Event not found");
        }

        // Check if user already in waitlist
        var existing = await _context.Waitlists
            .FirstOrDefaultAsync(w => w.UserId == userId
                && w.EventId == dto.EventId
                && (dto.TicketTypeId == null || w.TicketTypeId == dto.TicketTypeId)
                && !w.HasPurchased);

        if (existing != null)
        {
            throw new ConflictException("You are already on the waitlist for this event");
        }

        // Load user information
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found");
        }

        if (dto.TicketTypeId.HasValue)
        {
            var ticketType = await _context.TicketTypes
                .FirstOrDefaultAsync(tt => tt.Id == dto.TicketTypeId.Value
                    && tt.EventId == dto.EventId);

            if (ticketType == null)
            {
                throw new NotFoundException("Ticket type not found");
            }
        }

        var waitlistEntry = new Waitlist
        {
            UserId = userId,
            EventId = dto.EventId,
            TicketTypeId = dto.TicketTypeId,
            RequestedQuantity = dto.RequestedQuantity > 0 ? dto.RequestedQuantity : 1,
            JoinedAt = DateTime.UtcNow,
            IsNotified = false
        };

        _context.Waitlists.Add(waitlistEntry);
        await _context.SaveChangesAsync();

        var position = await _context.Waitlists
            .Where(w => w.EventId == dto.EventId
                && (dto.TicketTypeId == null || w.TicketTypeId == dto.TicketTypeId)
                && w.JoinedAt < waitlistEntry.JoinedAt
                && !w.HasPurchased)
            .CountAsync() + 1;

        // Reload with navigation properties
        await _context.Entry(waitlistEntry)
            .Reference(w => w.Event)
            .LoadAsync();

        await _context.Entry(waitlistEntry)
            .Reference(w => w.User)
            .LoadAsync();

        if (waitlistEntry.TicketTypeId.HasValue)
        {
            await _context.Entry(waitlistEntry)
                .Reference(w => w.TicketType)
                .LoadAsync();
        }

        _logger.LogInformation("User {UserId} joined waitlist for event {EventId}. Position: {Position}",
            userId, dto.EventId, position);

        return new WaitlistDto
        {
            WaitlistId = waitlistEntry.Id,
            UserId = waitlistEntry.UserId,
            UserName = waitlistEntry.User?.FullName ?? user.FullName,
            UserEmail = waitlistEntry.User?.Email ?? user.Email,
            EventId = waitlistEntry.EventId,
            EventTitle = waitlistEntry.Event?.Title ?? "",
            EventBanner = waitlistEntry.Event?.BannerImage,
            EventDate = waitlistEntry.Event?.StartDate ?? DateTime.MinValue,
            EventLocation = waitlistEntry.Event?.Location,
            TicketTypeId = waitlistEntry.TicketTypeId,
            TicketTypeName = waitlistEntry.TicketType?.Name,
            RequestedQuantity = waitlistEntry.RequestedQuantity,
            Status = "active",
            IsNotified = false,
            JoinedAt = waitlistEntry.JoinedAt,
            Position = position
        };
    }

    public async Task<bool> LeaveWaitlistAsync(int userId, int waitlistId)
    {
        var entry = await _context.Waitlists
            .FirstOrDefaultAsync(w => w.Id == waitlistId && w.UserId == userId);

        if (entry == null)
        {
            throw new NotFoundException("Waitlist entry not found");
        }

        if (entry.HasPurchased)
        {
            throw new BadRequestException("Cannot leave waitlist after purchase");
        }

        _context.Waitlists.Remove(entry);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> IsUserOnWaitlistAsync(int userId, int eventId, int? ticketTypeId = null)
    {
        return await _context.Waitlists
            .AnyAsync(w => w.UserId == userId
                && w.EventId == eventId
                && (ticketTypeId == null || w.TicketTypeId == ticketTypeId)
                && !w.HasPurchased);
    }

    private string GetWaitlistStatus(Waitlist entry)
    {
        if (entry.HasPurchased)
        {
            return "purchased";
        }

        if (entry.IsNotified)
        {
            if (entry.ExpiresAt.HasValue && entry.ExpiresAt.Value < DateTime.UtcNow)
            {
                return "expired";
            }
            return "notified";
        }

        if (entry.Event?.StartDate < DateTime.UtcNow)
        {
            return "expired";
        }

        return "active";
    }
}
