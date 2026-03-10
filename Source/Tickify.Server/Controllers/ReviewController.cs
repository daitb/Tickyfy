using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Review;
using Tickify.Services.Reviews;
using AutoMapper;

namespace Tickify.Controllers;

[ApiController]
[Route("api/reviews")]
public sealed class ReviewController : ControllerBase
{
    private readonly IReviewService _service;
    private readonly IMapper _mapper;
    private readonly ILogger<ReviewController> _logger;

    public ReviewController(
        IReviewService service, 
        IMapper mapper,
        ILogger<ReviewController> logger)
    {
        _service = service;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> Create([FromBody] CreateReviewDto dto)
    {
        try
        {
            var review = await _service.CreateAsync(dto, User);
            var reviewDto = _mapper.Map<ReviewDto>(review);
            return Ok(ApiResponse<ReviewDto>.SuccessResponse(reviewDto, "Review created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("[ReviewController] Create review failed: {Message}", ex.Message);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ReviewController] Error creating review");
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while creating review"));
        }
    }

    [HttpGet("event/{eventId:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReviewDto>>>> GetByEvent([FromRoute] int eventId)
    {
        try
        {
            var reviews = await _service.GetByEventAsync(eventId);
            var reviewDtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
            return Ok(ApiResponse<IEnumerable<ReviewDto>>.SuccessResponse(reviewDtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ReviewController] Error getting reviews for event {EventId}", eventId);
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while fetching reviews"));
        }
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> GetById([FromRoute] int id)
    {
        try
        {
            var review = await _service.GetByIdAsync(id);
            if (review == null)
                return NotFound(ApiResponse<object>.FailureResponse("Review not found"));

            var reviewDto = _mapper.Map<ReviewDto>(review);
            return Ok(ApiResponse<ReviewDto>.SuccessResponse(reviewDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ReviewController] Error getting review {ReviewId}", id);
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while fetching review"));
        }
    }

    [HttpGet("my-reviews")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ReviewDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReviewDto>>>> GetMine()
    {
        try
        {
            var reviews = await _service.GetMineAsync(User);
            var reviewDtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
            return Ok(ApiResponse<IEnumerable<ReviewDto>>.SuccessResponse(reviewDtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ReviewController] Error getting user reviews");
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while fetching reviews"));
        }
    }

    [HttpPut("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> UpdateMine([FromRoute] int id, [FromBody] UpdateReviewDto dto)
    {
        try
        {
            var review = await _service.UpdateMineAsync(id, dto, User);
            var reviewDto = _mapper.Map<ReviewDto>(review);
            return Ok(ApiResponse<ReviewDto>.SuccessResponse(reviewDto, "Review updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("[ReviewController] Update review failed: {Message}", ex.Message);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ReviewController] Error updating review {ReviewId}", id);
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while updating review"));
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteMine([FromRoute] int id)
    {
        try
        {
            var deleted = await _service.DeleteMineAsync(id, User);
            if (!deleted)
                return BadRequest(ApiResponse<object>.FailureResponse("Review not found or you don't have permission to delete it"));

            return Ok(ApiResponse<object>.SuccessResponse(new { deleted = true }, "Review deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ReviewController] Error deleting review {ReviewId}", id);
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while deleting review"));
        }
    }
}
