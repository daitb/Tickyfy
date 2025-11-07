using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Tickify.DTOs.Review;
using Tickify.Services;

namespace Tickify.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(IReviewService reviewService, ILogger<ReviewsController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<ReviewDto>> CreateReview([FromBody] CreateReviewDto request)
        {
            try
            {
                var userId = GetUserId();
                var review = await _reviewService.CreateReviewAsync(request, userId);
                return Ok(review);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ReviewDto>> UpdateReview(Guid id, [FromBody] UpdateReviewDto request)
        {
            try
            {
                var userId = GetUserId();
                var review = await _reviewService.UpdateReviewAsync(id, request, userId);
                return Ok(review);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReview(Guid id)
        {
            try
            {
                var userId = GetUserId();
                var success = await _reviewService.DeleteReviewAsync(id, userId);
                if (!success) return NotFound();
                return Ok(new { message = "Review deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("event/{eventId}")]
        [AllowAnonymous]
        public async Task<ActionResult<ReviewListDto>> GetEventReviews(
            Guid eventId, 
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var reviews = await _reviewService.GetEventReviewsAsync(eventId, page, pageSize);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting event reviews");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-reviews")]
        public async Task<ActionResult<List<ReviewDto>>> GetMyReviews()
        {
            try
            {
                var userId = GetUserId();
                var reviews = await _reviewService.GetUserReviewsAsync(userId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user reviews");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ReviewDto>> GetReview(Guid id)
        {
            try
            {
                var review = await _reviewService.GetReviewAsync(id);
                return Ok(review);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("can-review/{eventId}")]
        public async Task<ActionResult> CanReviewEvent(Guid eventId)
        {
            try
            {
                var userId = GetUserId();
                var canReview = await _reviewService.CanUserReviewEventAsync(eventId, userId);
                return Ok(new { canReview });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking review eligibility");
                return BadRequest(new { message = ex.Message });
            }
        }

        private Guid GetUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User ID not found in claims");
            }
            return Guid.Parse(userId);
        }
    }
}