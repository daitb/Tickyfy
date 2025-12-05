// Controllers/PromoCodeController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.PromoCode;
using Tickify.Exceptions;
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
        // Get current user ID and role from claims
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        var userRoleClaim = User.FindFirst(ClaimTypes.Role) ?? User.FindFirst("role");
        
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            return BadRequest(ApiResponse<IEnumerable<PromoCodeDto>>.FailureResponse("Invalid user authentication"));
        }

        var userRole = userRoleClaim?.Value ?? "User";
        var promoCodes = await _promoCodeService.GetAllPromoCodesForUserAsync(userId, userRole);
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
        catch (BadRequestException ex)
        {
            Console.WriteLine($"[PromoCodeController.Create] BadRequest: {ex.Message}");
            Console.WriteLine($"[PromoCodeController.Create] CreateDto Code: {createDto?.Code}");
            return BadRequest(ApiResponse<PromoCodeDto>.FailureResponse(ex.Message));
        }
        catch (ConflictException ex)
        {
            // Log duplicate code error with details
            Console.WriteLine($"[PromoCodeController.Create] Conflict - Duplicate code: {createDto?.Code}");
            Console.WriteLine($"[PromoCodeController.Create] UserId: {User.FindFirst("userId")?.Value ?? "Unknown"}");
            Console.WriteLine($"[PromoCodeController.Create] StackTrace: {Environment.StackTrace}");
            return Conflict(ApiResponse<PromoCodeDto>.FailureResponse(ex.Message));
        }
        catch (ForbiddenException ex)
        {
            Console.WriteLine($"[PromoCodeController.Create] Forbidden: {ex.Message}");
            return StatusCode(403, ApiResponse<PromoCodeDto>.FailureResponse(ex.Message));
        }
        catch (NotFoundException ex)
        {
            Console.WriteLine($"[PromoCodeController.Create] NotFound: {ex.Message}");
            return NotFound(ApiResponse<PromoCodeDto>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            // Log detailed error information
            Console.WriteLine($"[PromoCodeController.Create] Unexpected error: {ex.Message}");
            Console.WriteLine($"[PromoCodeController.Create] CreateDto Code: {createDto?.Code}");
            Console.WriteLine($"[PromoCodeController.Create] CreateDto EventId: {createDto?.EventId}");
            Console.WriteLine($"[PromoCodeController.Create] UserId: {User.FindFirst("userId")?.Value ?? "Unknown"}");
            Console.WriteLine($"[PromoCodeController.Create] StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[PromoCodeController.Create] InnerException: {ex.InnerException.Message}");
                Console.WriteLine($"[PromoCodeController.Create] InnerException StackTrace: {ex.InnerException.StackTrace}");
            }
            return StatusCode(500, ApiResponse<PromoCodeDto>.FailureResponse($"An error occurred while creating the promo code: {ex.Message}"));
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
        try
        {
            // Get current user ID from claims
            var userIdClaim = User.FindFirst("userId") ?? User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<PromoCodeDto>.FailureResponse("Invalid user authentication"));
            }

            var promoCode = await _promoCodeService.UpdateAsync(id, updateDto, userId);
            return Ok(ApiResponse<PromoCodeDto>.SuccessResponse(promoCode, "Promo code updated successfully"));
        }
        catch (BadRequestException ex)
        {
            return BadRequest(ApiResponse<PromoCodeDto>.FailureResponse(ex.Message));
        }
        catch (NotFoundException ex)
        {
            return NotFound(ApiResponse<PromoCodeDto>.FailureResponse(ex.Message));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, ApiResponse<PromoCodeDto>.FailureResponse(ex.Message));
        }
        catch (ConflictException ex)
        {
            return Conflict(ApiResponse<PromoCodeDto>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PromoCodeController.Update] Unexpected error: {ex.Message}");
            Console.WriteLine($"[PromoCodeController.Update] StackTrace: {ex.StackTrace}");
            return StatusCode(500, ApiResponse<PromoCodeDto>.FailureResponse($"An error occurred while updating the promo code: {ex.Message}"));
        }
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