using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Wishlist;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Authorize]
[Route("api/wishlist")]
[Produces("application/json")]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlistService;
    private readonly ILogger<WishlistController> _logger;

    public WishlistController(
        IWishlistService wishlistService,
        ILogger<WishlistController> logger)
    {
        _wishlistService = wishlistService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<WishlistDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<WishlistDto>>>> GetWishlist(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();

        var result = await _wishlistService.GetUserWishlistAsync(userId, pageNumber, pageSize);

        return Ok(ApiResponse<PagedResult<WishlistDto>>.SuccessResponse(
            result,
            $"Retrieved {result.Items.Count} of {result.TotalCount} wishlist items"));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<WishlistDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<WishlistDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<WishlistDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<WishlistDto>>> AddToWishlist([FromBody] AddToWishlistDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<WishlistDto>.FailureResponse(
                "Validation failed",
                errors));
        }

        var userId = GetUserId();

        var item = await _wishlistService.AddToWishlistAsync(userId, dto.EventId);

        return Ok(ApiResponse<WishlistDto>.SuccessResponse(
            item,
            "Event added to wishlist"));
    }

    [HttpDelete("{eventId:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object?>>> RemoveFromWishlist(int eventId)
    {
        var userId = GetUserId();

        await _wishlistService.RemoveFromWishlistAsync(userId, eventId);

        return Ok(ApiResponse<object?>.SuccessResponse(
            null,
            "Event removed from wishlist"));
    }

    [HttpGet("check/{eventId:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> CheckWishlist(int eventId)
    {
        var userId = GetUserId();

        var isInWishlist = await _wishlistService.IsInWishlistAsync(userId, eventId);

        return Ok(ApiResponse<object>.SuccessResponse(
            new { isInWishlist },
            isInWishlist ? "Event is in wishlist" : "Event is not in wishlist"));
    }

    [HttpGet("count")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetWishlistCount()
    {
        var userId = GetUserId();

        var count = await _wishlistService.GetWishlistCountAsync(userId);

        return Ok(ApiResponse<object>.SuccessResponse(
            new { count },
            "Wishlist count retrieved"));
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("userId")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }

        return userId;
    }
}

