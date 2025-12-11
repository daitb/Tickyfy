using System.Security.Claims;
using Tickify.DTOs.Review;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Services.Reviews;

public interface IReviewService
{
    Task<Review> CreateAsync(CreateReviewDto dto, ClaimsPrincipal user);
    Task<Review?> GetByIdAsync(int id);
    Task<IEnumerable<Review>> GetByEventAsync(int eventId);
    Task<IEnumerable<Review>> GetMineAsync(ClaimsPrincipal user);
    Task<Review> UpdateMineAsync(int id, UpdateReviewDto dto, ClaimsPrincipal user);
    Task<bool> DeleteMineAsync(int id, ClaimsPrincipal user);
}

public sealed class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviews;
    private readonly ITicketRepository _tickets;
    private readonly ITicketScanRepository _ticketScans;

    public ReviewService(
        IReviewRepository reviews,
        ITicketRepository tickets,
        ITicketScanRepository ticketScans)
    {
        _reviews = reviews;
        _tickets = tickets;
        _ticketScans = ticketScans;
    }

    public async Task<Review> CreateAsync(CreateReviewDto dto, ClaimsPrincipal user)
    {
        var uid = GetUserId(user);
        
        // TODO: For production, uncomment these validations
        // Validate that user attended the event (has scanned tickets)
        // var userTickets = await _tickets.GetByUserIdAsync(uid);
        // var eventTickets = userTickets.Where(t => t.Booking?.EventId == dto.EventId).ToList();
        
        // if (!eventTickets.Any())
        // {
        //     throw new InvalidOperationException("You must have tickets for this event to review it.");
        // }

        // Check if any ticket was scanned (user attended)
        // var hasAttended = false;
        // foreach (var ticket in eventTickets)
        // {
        //     var scans = await _ticketScans.GetByTicketIdAsync(ticket.Id);
        //     if (scans.Any(s => s.IsValid))
        //     {
        //         hasAttended = true;
        //         break;
        //     }
        // }

        // if (!hasAttended)
        // {
        //     throw new InvalidOperationException("You must have attended the event (ticket scanned) to submit a review.");
        // }

        // Check if user already reviewed this event
        var existingReview = (await _reviews.GetByUserIdAsync(uid))
            .FirstOrDefault(r => r.EventId == dto.EventId);
        if (existingReview != null)
        {
            throw new InvalidOperationException("You have already reviewed this event. Please update your existing review instead.");
        }

        var entity = new Review
        {
            EventId = dto.EventId,
            UserId = uid,
            Rating = dto.Rating,
            Comment = dto.Comment
        };
        
        var review = await _reviews.CreateAsync(entity);
        
        // Recalculate event average rating (Event doesn't have AverageRating field, it's calculated on the fly)
        // This is handled in EventService when fetching event details
        
        return review;
    }

    public Task<Review?> GetByIdAsync(int id)
        => _reviews.GetByIdAsync(id);

    public Task<IEnumerable<Review>> GetByEventAsync(int eventId)
        => _reviews.GetByEventIdAsync(eventId);

    public Task<IEnumerable<Review>> GetMineAsync(ClaimsPrincipal user)
        => _reviews.GetByUserIdAsync(GetUserId(user));

    public async Task<Review> UpdateMineAsync(int id, UpdateReviewDto dto, ClaimsPrincipal user)
    {
        var uid = GetUserId(user);
        var mine = (await _reviews.GetByUserIdAsync(uid)).FirstOrDefault(x => x.Id == id)
                   ?? throw new InvalidOperationException("Review not found or not owned by user");
        mine.Rating = dto.Rating;
        mine.Comment = dto.Comment;
        mine.UpdatedAt = DateTime.UtcNow;
        
        var updated = await _reviews.UpdateAsync(mine);
        
        // Recalculate event average rating
        // This is handled in EventService when fetching event details
        
        return updated;
    }

    public async Task<bool> DeleteMineAsync(int id, ClaimsPrincipal user)
    {
        var deleted = await _reviews.DeleteAsync(id, GetUserId(user), isAdmin: false);
        
        if (deleted)
        {
            // Recalculate event average rating
            // This is handled in EventService when fetching event details
        }
        
        return deleted;
    }

    private static int GetUserId(ClaimsPrincipal user)
    {
        var idStr = user.FindFirstValue("userId") ?? user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        return int.TryParse(idStr, out var id) ? id : 0;
    }
}
