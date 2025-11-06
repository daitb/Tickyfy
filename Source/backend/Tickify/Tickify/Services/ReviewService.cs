using Microsoft.EntityFrameworkCore;
using Tickify.DTOs.Review;
using Tickify.Models;
using Tickify.Data;
namespace Tickify.Services
{
    public interface IReviewService
    {
        Task<ReviewDto> CreateReviewAsync(CreateReviewDto request, Guid userId);
        Task<ReviewDto> UpdateReviewAsync(Guid reviewId, UpdateReviewDto request, Guid userId);
        Task<bool> DeleteReviewAsync(Guid reviewId, Guid userId);
        Task<ReviewListDto> GetEventReviewsAsync(Guid eventId, int page = 1, int pageSize = 10);
        Task<List<ReviewDto>> GetUserReviewsAsync(Guid userId);
        Task<ReviewDto> GetReviewAsync(Guid reviewId);
        Task<bool> CanUserReviewEventAsync(Guid eventId, Guid userId);
    }

    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(ApplicationDbContext context, ILogger<ReviewService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ReviewDto> CreateReviewAsync(CreateReviewDto request, Guid userId)
        {
            var canReview = await CanUserReviewEventAsync(request.EventId, userId);
            if (!canReview)
                throw new Exception("Bạn phải tham gia sự kiện trước khi đánh giá");

            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.EventId == request.EventId && r.UserId == userId);

            if (existingReview != null)
                throw new Exception("Bạn đã đánh giá sự kiện này rồi");

            var review = new Review
            {
                Id = Guid.NewGuid(),
                EventId = request.EventId,
                UserId = userId,
                Rating = request.Rating,
                Comment = request.Comment,
                ImageUrls = request.ImageUrls ?? new List<string>(),
                IsAnonymous = request.IsAnonymous,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            await UpdateEventRatingAsync(request.EventId);
            return await MapToReviewDto(review);
        }

        public async Task<ReviewDto> UpdateReviewAsync(Guid reviewId, UpdateReviewDto request, Guid userId)
        {
            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId);

            if (review == null)
                throw new Exception("Review not found");

            if (request.Rating.HasValue)
                review.Rating = request.Rating.Value;
            
            if (!string.IsNullOrEmpty(request.Comment))
                review.Comment = request.Comment;
            
            if (request.ImageUrls != null)
                review.ImageUrls = request.ImageUrls;
            
            if (request.IsAnonymous.HasValue)
                review.IsAnonymous = request.IsAnonymous.Value;

            review.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await UpdateEventRatingAsync(review.EventId);
            return await MapToReviewDto(review);
        }

        public async Task<bool> DeleteReviewAsync(Guid reviewId, Guid userId)
        {
            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId && r.UserId == userId);

            if (review == null) return false;

            var eventId = review.EventId;
            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            await UpdateEventRatingAsync(eventId);
            return true;
        }

        public async Task<ReviewListDto> GetEventReviewsAsync(Guid eventId, int page = 1, int pageSize = 10)
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .Where(r => r.EventId == eventId && !r.IsAnonymous)
                .OrderByDescending(r => r.CreatedAt);

            var totalCount = await query.CountAsync();
            var reviews = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ratings = await _context.Reviews
                .Where(r => r.EventId == eventId)
                .Select(r => r.Rating)
                .ToListAsync();

            var averageRating = ratings.Any() ? ratings.Average() : 0;
            var distribution = Enumerable.Range(1, 5)
                .ToDictionary(i => i, i => ratings.Count(r => r == i));

            var reviewDtos = new List<ReviewDto>();
            foreach (var review in reviews)
            {
                reviewDtos.Add(await MapToReviewDto(review));
            }

            return new ReviewListDto
            {
                Reviews = reviewDtos,
                AverageRating = Math.Round(averageRating, 1),
                TotalCount = totalCount,
                RatingDistribution = distribution
            };
        }

        public async Task<List<ReviewDto>> GetUserReviewsAsync(Guid userId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Event)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var reviewDtos = new List<ReviewDto>();
            foreach (var review in reviews)
            {
                reviewDtos.Add(await MapToReviewDto(review));
            }

            return reviewDtos;
        }

        public async Task<ReviewDto> GetReviewAsync(Guid reviewId)
        {
            var review = await _context.Reviews
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            if (review == null)
                throw new Exception("Review not found");

            return await MapToReviewDto(review);
        }

        public async Task<bool> CanUserReviewEventAsync(Guid eventId, Guid userId)
        {
            var hasAttended = await _context.Tickets
                .Include(t => t.Booking)
                .Where(t => t.Booking.UserId == userId && 
                           t.Booking.EventId == eventId && 
                           t.Booking.Status == BookingStatus.Confirmed)
                .AnyAsync(t => t.Scans.Any(s => s.ScannedAt != null));

            return hasAttended;
        }

        private async Task UpdateEventRatingAsync(Guid eventId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.EventId == eventId)
                .ToListAsync();

            if (reviews.Any())
            {
                var averageRating = reviews.Average(r => r.Rating);
                var eventEntity = await _context.Events.FindAsync(eventId);
                if (eventEntity != null)
                {
                    eventEntity.AverageRating = Math.Round((decimal)averageRating, 1);
                    eventEntity.ReviewCount = reviews.Count;
                    await _context.SaveChangesAsync();
                }
            }
        }

        private async Task<ReviewDto> MapToReviewDto(Review review)
        {
            var user = await _context.Users.FindAsync(review.UserId);

            return new ReviewDto
            {
                Id = review.Id,
                EventId = review.EventId,
                UserId = review.UserId,
                UserName = review.IsAnonymous ? "Ẩn danh" : user?.FullName ?? "Người dùng",
                UserAvatar = review.IsAnonymous ? null : user?.AvatarUrl,
                Rating = review.Rating,
                Comment = review.Comment,
                ImageUrls = review.ImageUrls,
                IsAnonymous = review.IsAnonymous,
                IsVerified = review.IsVerified,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt
            };
        }
    }
}