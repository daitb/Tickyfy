// Controllers/ReviewController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.DTOs.Review;
using Tickify.Services.Reviews;

namespace Tickify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ReviewController : ControllerBase
{
    private readonly IReviewService _service;
    public ReviewController(IReviewService service) => _service = service;

    // Tạo đánh giá (user)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
        => Ok(await _service.CreateAsync(dto, User));

    // Lấy reviews theo event (public)
    [AllowAnonymous]
    [HttpGet("event/{eventId:int}")]
    public async Task<IActionResult> GetByEvent([FromRoute] int eventId)
        => Ok(await _service.GetByEventAsync(eventId));

    // Lấy review theo ID (public)
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var review = await _service.GetByIdAsync(id);
        if (review == null)
            return NotFound();
        return Ok(review);
    }

    // Lấy reviews của tôi (user)
    [Authorize]
    [HttpGet("my-reviews")]
    public async Task<IActionResult> GetMine()
        => Ok(await _service.GetMineAsync(User));

    // Cập nhật review của tôi
    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateMine([FromRoute] int id, [FromBody] UpdateReviewDto dto)
        => Ok(await _service.UpdateMineAsync(id, dto, User));

    // Xoá review của tôi
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteMine([FromRoute] int id)
        => Ok(await _service.DeleteMineAsync(id, User));
}
