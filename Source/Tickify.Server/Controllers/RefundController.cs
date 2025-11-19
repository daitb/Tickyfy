// Controllers/RefundController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.DTOs.Refund;
using Tickify.Services.Refunds;

namespace Tickify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RefundController : ControllerBase
{
    private readonly IRefundService _service;
    public RefundController(IRefundService service) => _service = service;

    // 1) Tạo yêu cầu hoàn tiền
    [Authorize]
    [HttpPost("request")]
    public async Task<IActionResult> Create([FromBody] CreateRefundRequestDto dto)
        => Ok(await _service.CreateAsync(dto, User));

    // 2) Danh sách (Admin/Staff)
    [Authorize(Roles = "Admin,Staff")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    // 3) Chi tiết 1 request
    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id)
        => Ok(await _service.GetByIdAsync(id));

    // 4) Danh sách của tôi
    [Authorize]
    [HttpGet("my-refunds")]
    public async Task<IActionResult> GetMine()
        => Ok(await _service.GetMineAsync(User));

    // 5) Phê duyệt
    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve([FromRoute] int id, [FromBody] ApproveRefundDto dto)
        => Ok(await _service.ApproveAsync(id, User, dto));

    // 6) Từ chối
    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject([FromRoute] int id, [FromBody] RejectRefundDto dto)
        => Ok(await _service.RejectAsync(id, User, dto));
}
