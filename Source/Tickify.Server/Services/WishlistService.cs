using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Tickify.Common;
using Tickify.Data;
using Tickify.DTOs.Wishlist;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services;

/// <summary>
/// Handles wishlist operations and projections for the authenticated user.
/// </summary>
public class WishlistService : IWishlistService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WishlistService> _logger;

    public WishlistService(ApplicationDbContext context, ILogger<WishlistService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<WishlistDto>> GetUserWishlistAsync(int userId, int pageNumber = 1, int pageSize = 20)
    {
        _logger.LogInformation("Fetching wishlist for user {UserId}, page {PageNumber}, size {PageSize}", userId, pageNumber, pageSize);

        var now = DateTime.UtcNow;

        var query = _context.Wishlists
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.AddedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(BuildWishlistProjection(now))
            .ToListAsync();

        return new PagedResult<WishlistDto>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<WishlistDto> AddToWishlistAsync(int userId, int eventId)
    {
        _logger.LogInformation("Adding event {EventId} to wishlist for user {UserId}", eventId, userId);

        var eventEntity = await _context.Events
            .Include(e => e.TicketTypes)
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (eventEntity == null)
        {
            throw new NotFoundException($"Event with ID {eventId} not found");
        }

        var exists = await _context.Wishlists
            .AnyAsync(w => w.UserId == userId && w.EventId == eventId);

        if (exists)
        {
            throw new ConflictException("Event already exists in wishlist");
        }

        var wishlist = new Wishlist
        {
            UserId = userId,
            EventId = eventId,
            AddedAt = DateTime.UtcNow
        };

        _context.Wishlists.Add(wishlist);
        await _context.SaveChangesAsync();

        return await GetWishlistItemDtoAsync(wishlist.Id);
    }

    public async Task RemoveFromWishlistAsync(int userId, int eventId)
    {
        _logger.LogInformation("Removing event {EventId} from wishlist for user {UserId}", eventId, userId);

        var wishlist = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.EventId == eventId);

        if (wishlist == null)
        {
            throw new NotFoundException("Wishlist item not found");
        }

        _context.Wishlists.Remove(wishlist);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> IsInWishlistAsync(int userId, int eventId)
    {
        return await _context.Wishlists
            .AnyAsync(w => w.UserId == userId && w.EventId == eventId);
    }

    public async Task<int> GetWishlistCountAsync(int userId)
    {
        return await _context.Wishlists.CountAsync(w => w.UserId == userId);
    }

    private async Task<WishlistDto> GetWishlistItemDtoAsync(int wishlistId)
    {
        var now = DateTime.UtcNow;

        var dto = await _context.Wishlists
            .AsNoTracking()
            .Where(w => w.Id == wishlistId)
            .Select(BuildWishlistProjection(now))
            .FirstOrDefaultAsync();

        if (dto == null)
        {
            throw new NotFoundException("Wishlist item not found after creation");
        }

        return dto;
    }

    private static Expression<Func<Wishlist, WishlistDto>> BuildWishlistProjection(DateTime nowUtc)
    {
        return w => new WishlistDto
        {
            WishlistId = w.Id,
            UserId = w.UserId,
            EventId = w.EventId,
            EventTitle = w.Event!.Title,
            EventImageUrl = w.Event!.BannerImage,
            EventStartDate = w.Event!.StartDate,
            EventVenue = w.Event!.Location,
            EventCity = w.Event!.Address ?? string.Empty,
            EventCategory = w.Event!.Category != null ? w.Event.Category.Name : string.Empty,
            EventStatus = w.Event!.Status.ToString(),
            MinPrice = w.Event!.TicketTypes != null && w.Event.TicketTypes.Any()
                ? w.Event.TicketTypes.Min(tt => tt.Price)
                : 0,
            MaxPrice = w.Event!.TicketTypes != null && w.Event.TicketTypes.Any()
                ? w.Event.TicketTypes.Max(tt => tt.Price)
                : 0,
            AvailableTickets = w.Event!.TicketTypes != null
                ? w.Event.TicketTypes.Sum(tt => tt.AvailableQuantity)
                : 0,
            TotalTickets = w.Event!.TicketTypes != null
                ? w.Event.TicketTypes.Sum(tt => tt.TotalQuantity)
                : 0,
            IsEventActive = w.Event!.Status == EventStatus.Published && w.Event.StartDate >= nowUtc,
            AddedAt = w.AddedAt
        };
    }
}

