// Services/Reviews/ReviewService.cs
using System.Security.Claims;
using Tickify.DTOs.Review;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Services.Reviews;

public interface IReviewService
{
    Task<Review> CreateAsync(CreateReviewDto dto, ClaimsPrincipal user);
    Task<IEnumerable<Review>> GetByEventAsync(int eventId);
    Task<IEnumerable<Review>> GetMineAsync(ClaimsPrincipal user);
    Task<Review> UpdateMineAsync(int id, UpdateReviewDto dto, ClaimsPrincipal user);
    Task<bool> DeleteMineAsync(int id, ClaimsPrincipal user);
}

public sealed class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviews;

    public ReviewService(IReviewRepository reviews) => _reviews = reviews;

    public async Task<Review> CreateAsync(CreateReviewDto dto, ClaimsPrincipal user)
    {
        var uid = GetUserId(user);
        var entity = new Review
        {
            EventId = dto.EventId,
            UserId = uid,
            Rating = dto.Rating,
            Comment = dto.Comment
        };
        return await _reviews.CreateAsync(entity);
    }

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
        return await _reviews.UpdateAsync(mine);
    }

    public Task<bool> DeleteMineAsync(int id, ClaimsPrincipal user)
        => _reviews.DeleteAsync(id, GetUserId(user), isAdmin: false);

    private static int GetUserId(ClaimsPrincipal user)
    {
        var idStr = user.FindFirstValue("userId") ?? user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        return int.TryParse(idStr, out var id) ? id : 0;
    }
}
