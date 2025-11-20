// Controllers/PromoCodeController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.PromoCode;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PromoCodeController : ControllerBase
{
    private readonly IPromoCodeService _promoCodeService;

    public PromoCodeController(IPromoCodeService promoCodeService)
    {
        _promoCodeService = promoCodeService;
    }

    // GET: api/PromoCode
    [HttpGet]
    [Authorize(Roles = "Admin,Organizer")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PromoCodeDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PromoCodeDto>>>> GetAll()
    {
        var promoCodes = await _promoCodeService.GetActivePromoCodesAsync();
        return Ok(ApiResponse<IEnumerable<PromoCodeDto>>.SuccessResponse(promoCodes, "Promo codes retrieved successfully"));
    }

    // GET: api/PromoCode/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Organizer")]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PromoCodeDto>>> GetById(int id)
    {
        var promoCode = await _promoCodeService.GetByIdAsync(id);
        return Ok(ApiResponse<PromoCodeDto>.SuccessResponse(promoCode, "Promo code retrieved successfully"));
    }

    // GET: api/PromoCode/event/{eventId}
    [HttpGet("event/{eventId}")]
    [Authorize(Roles = "Admin,Organizer")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PromoCodeDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PromoCodeDto>>>> GetByEventId(int eventId)
    {
        var promoCodes = await _promoCodeService.GetByEventIdAsync(eventId);
        return Ok(ApiResponse<IEnumerable<PromoCodeDto>>.SuccessResponse(promoCodes, "Event promo codes retrieved successfully"));
    }

    // POST: api/PromoCode/validate
    [HttpPost("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PromoCodeDto>>> ValidatePromoCode([FromBody] ValidatePromoCodeDto validateDto)
    {
        var result = await _promoCodeService.ValidatePromoCodeAsync(validateDto);
        return Ok(ApiResponse<PromoCodeDto>.SuccessResponse(result, "Promo code validated successfully"));
    }

    // POST: api/PromoCode/calculate-discount
    [HttpPost("calculate-discount")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<decimal>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<decimal>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<decimal>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<decimal>>> CalculateDiscount([FromBody] ValidatePromoCodeDto validateDto)
    {
        var discount = await _promoCodeService.CalculateDiscountAsync(validateDto.Code, validateDto.EventId, validateDto.OrderTotal);
        return Ok(ApiResponse<decimal>.SuccessResponse(discount, "Discount calculated successfully"));
    }

    // POST: api/PromoCode
    [HttpPost]
    [Authorize(Roles = "Admin,Organizer")]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PromoCodeDto>>> Create([FromBody] CreatePromoCodeDto createDto)
    {
        try
        {
            // Get current user ID from claims
            var userIdClaim = User.FindFirst("userId") ?? User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<PromoCodeDto>.FailureResponse($"Invalid user authentication - claim not found or invalid. Available claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}: {c.Value}"))}"));
            }

            var promoCode = await _promoCodeService.CreateAsync(createDto, userId);
            return CreatedAtAction(nameof(GetById), new { id = promoCode.PromoCodeId },
                ApiResponse<PromoCodeDto>.SuccessResponse(promoCode, "Promo code created successfully"));
        }
        catch (Exception ex)
        {
            // Log the exception for debugging
            Console.WriteLine($"Error creating promo code: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest(ApiResponse<PromoCodeDto>.FailureResponse($"Internal server error: {ex.Message}"));
        }
    }

    // PUT: api/PromoCode/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Organizer")]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PromoCodeDto>>> Update(int id, [FromBody] UpdatePromoCodeDto updateDto)
    {
        var promoCode = await _promoCodeService.UpdateAsync(id, updateDto);
        return Ok(ApiResponse<PromoCodeDto>.SuccessResponse(promoCode, "Promo code updated successfully"));
    }

    // DELETE: api/PromoCode/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Organizer")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var result = await _promoCodeService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(ApiResponse<bool>.FailureResponse("Promo code not found"));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, "Promo code deleted successfully"));
    }
}



/*
sửa lỗi update promo code, bị mất promote code cũ trên giao diện khi cập nhật 
thêm hiển thị alert khi tạo promo code trùng mã
thêm log lỗi chi tiết khi tạo promo code thất bại
thêm chức năng sự kiện chỉ được promode code từ organizer của sự kiện đó hoặc admin
*/