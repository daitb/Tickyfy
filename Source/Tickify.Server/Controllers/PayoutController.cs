using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Common;
using Tickify.DTOs.Payout;
using Tickify.Services.Payouts;

namespace Tickify.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class PayoutController : ControllerBase
{
    private readonly IPayoutService _service;

    public PayoutController(IPayoutService service) => _service = service;

    /// <summary>
    /// GET /api/payouts - List payouts (Organizer/Admin)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PayoutDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
        => Ok(ApiResponse<IEnumerable<PayoutDto>>.SuccessResponse(
            await _service.GetAllPayoutsAsync(User),
            "Payouts retrieved successfully"
        ));

    /// <summary>
    /// GET /api/payouts/{id} - Payout details
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PayoutDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var payout = await _service.GetPayoutByIdAsync(id, User);
        if (payout == null)
            return NotFound(ApiResponse<object>.FailureResponse("Payout not found"));

        return Ok(ApiResponse<PayoutDto>.SuccessResponse(payout, "Payout retrieved successfully"));
    }

    /// <summary>
    /// POST /api/payouts/request - Request payout (Organizer)
    /// </summary>
    [HttpPost("request")]
    [ProducesResponseType(typeof(ApiResponse<PayoutDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RequestPayout([FromBody] RequestPayoutDto dto)
    {
        try
        {
            var payout = await _service.RequestPayoutAsync(dto, User);
            return Ok(ApiResponse<PayoutDto>.SuccessResponse(
                payout,
                "Payout request created successfully"
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// POST /api/payouts/{id}/approve - Approve payout (Admin)
    /// </summary>
    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<PayoutDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Approve([FromRoute] int id, [FromBody] ApprovePayoutDto dto)
    {
        try
        {
            var payout = await _service.ApprovePayoutAsync(id, User, dto);
            return Ok(ApiResponse<PayoutDto>.SuccessResponse(
                payout,
                "Payout approved successfully"
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// POST /api/payouts/{id}/reject - Reject payout (Admin)
    /// </summary>
    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<PayoutDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Reject([FromRoute] int id, [FromBody] RejectPayoutDto dto)
    {
        try
        {
            var payout = await _service.RejectPayoutAsync(id, User, dto);
            return Ok(ApiResponse<PayoutDto>.SuccessResponse(
                payout,
                "Payout rejected successfully"
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// GET /api/payouts/organizer/{organizerId}/stats - Payout statistics
    /// </summary>
    [HttpGet("organizer/{organizerId:int}/stats")]
    [ProducesResponseType(typeof(ApiResponse<PayoutStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrganizerStats([FromRoute] int organizerId)
    {
        try
        {
            var stats = await _service.GetOrganizerStatsAsync(organizerId, User);
            return Ok(ApiResponse<PayoutStatsDto>.SuccessResponse(
                stats,
                "Payout statistics retrieved successfully"
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
    }
}

