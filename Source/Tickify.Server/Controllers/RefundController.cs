// Controllers/RefundController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Refund;
using Tickify.Services.Refunds;
using AutoMapper;

namespace Tickify.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RefundController : ControllerBase
{
    private readonly IRefundService _service;
    private readonly IMapper _mapper;
    private readonly ILogger<RefundController> _logger;

    public RefundController(
        IRefundService service,
        IMapper mapper,
        ILogger<RefundController> logger)
    {
        _service = service;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get current user ID from JWT token
    /// </summary>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }
        return userId;
    }

    /// <summary>
    /// POST /api/refund/request - Create refund request (requires authentication)
    /// </summary>
    [HttpPost("request")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<RefundRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<RefundRequestDto>>> Create([FromBody] CreateRefundRequestDto dto)
    {
        try
        {
            var refundRequest = await _service.CreateAsync(dto, User);
            var refundDto = _mapper.Map<RefundRequestDto>(refundRequest);
            return Ok(ApiResponse<RefundRequestDto>.SuccessResponse(refundDto, "Refund request created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("[RefundController] Create refund request failed: {Message}", ex.Message);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[RefundController] Error creating refund request");
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while creating refund request"));
        }
    }

    /// <summary>
    /// GET /api/refund - Get all refund requests (Admin/Staff only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<RefundRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<IEnumerable<RefundRequestDto>>>> GetAll()
    {
        try
        {
            var refundRequests = await _service.GetAllAsync();
            var refundDtos = _mapper.Map<IEnumerable<RefundRequestDto>>(refundRequests);
            return Ok(ApiResponse<IEnumerable<RefundRequestDto>>.SuccessResponse(refundDtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[RefundController] Error getting all refund requests");
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while fetching refund requests"));
        }
    }

    /// <summary>
    /// GET /api/refund/{id} - Get refund request by ID (requires authentication)
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<RefundRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<RefundRequestDto>>> GetById([FromRoute] int id)
    {
        try
        {
            var refundRequest = await _service.GetByIdAsync(id);
            if (refundRequest == null)
                return NotFound(ApiResponse<object>.FailureResponse("Refund request not found"));

            // Authorization: User can only view their own refund requests, unless they are Admin/Staff
            var userId = GetCurrentUserId();
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");
            
            if (!isAdmin && refundRequest.UserId != userId)
            {
                _logger.LogWarning("[RefundController] User {UserId} attempted to access refund {RefundId} they don't own", userId, id);
                return Forbid();
            }

            var refundDto = _mapper.Map<RefundRequestDto>(refundRequest);
            return Ok(ApiResponse<RefundRequestDto>.SuccessResponse(refundDto));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[RefundController] Error getting refund request {RefundId}", id);
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while fetching refund request"));
        }
    }

    /// <summary>
    /// GET /api/refund/my-refunds - Get current user's refund requests (requires authentication)
    /// </summary>
    [HttpGet("my-refunds")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<RefundRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<IEnumerable<RefundRequestDto>>>> GetMine()
    {
        try
        {
            var refundRequests = await _service.GetMineAsync(User);
            var refundDtos = _mapper.Map<IEnumerable<RefundRequestDto>>(refundRequests);
            return Ok(ApiResponse<IEnumerable<RefundRequestDto>>.SuccessResponse(refundDtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[RefundController] Error getting user refund requests");
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while fetching refund requests"));
        }
    }

    /// <summary>
    /// POST /api/refund/{id}/approve - Approve refund request (Admin/Staff only)
    /// </summary>
    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<RefundRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<RefundRequestDto>>> Approve([FromRoute] int id, [FromBody] ApproveRefundDto dto)
    {
        try
        {
            var refundRequest = await _service.ApproveAsync(id, User, dto);
            var refundDto = _mapper.Map<RefundRequestDto>(refundRequest);
            return Ok(ApiResponse<RefundRequestDto>.SuccessResponse(refundDto, "Refund request approved successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("[RefundController] Approve refund failed: {Message}", ex.Message);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[RefundController] Error approving refund request {RefundId}", id);
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while approving refund request"));
        }
    }

    /// <summary>
    /// POST /api/refund/{id}/reject - Reject refund request (Admin/Staff only)
    /// </summary>
    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<RefundRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<RefundRequestDto>>> Reject([FromRoute] int id, [FromBody] RejectRefundDto dto)
    {
        try
        {
            var refundRequest = await _service.RejectAsync(id, User, dto);
            var refundDto = _mapper.Map<RefundRequestDto>(refundRequest);
            return Ok(ApiResponse<RefundRequestDto>.SuccessResponse(refundDto, "Refund request rejected"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("[RefundController] Reject refund failed: {Message}", ex.Message);
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[RefundController] Error rejecting refund request {RefundId}", id);
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while rejecting refund request"));
        }
    }
}
