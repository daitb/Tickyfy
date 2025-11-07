using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Tickify.DTOs.Refund;
using Tickify.Services;

namespace Tickify.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RefundsController : ControllerBase
    {
        private readonly IRefundService _refundService;
        private readonly ILogger<RefundsController> _logger;

        public RefundsController(IRefundService refundService, ILogger<RefundsController> logger)
        {
            _refundService = refundService;
            _logger = logger;
        }

        [HttpPost("request")]
        public async Task<ActionResult<RefundRequestDto>> RequestRefund([FromBody] CreateRefundRequestDto request)
        {
            try
            {
                var userId = GetUserId();
                var refundRequest = await _refundService.CreateRefundRequestAsync(request, userId);
                return Ok(refundRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating refund request");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<RefundRequestDto>>> GetRefundRequests([FromQuery] string? status)
        {
            try
            {
                RefundStatus? refundStatus = null;
                if (!string.IsNullOrEmpty(status) && Enum.TryParse<RefundStatus>(status, out var parsedStatus))
                {
                    refundStatus = parsedStatus;
                }

                var refunds = await _refundService.GetRefundRequestsAsync(refundStatus);
                return Ok(refunds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting refund requests");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-refunds")]
        public async Task<ActionResult<List<RefundRequestDto>>> GetMyRefunds()
        {
            try
            {
                var userId = GetUserId();
                var refunds = await _refundService.GetUserRefundRequestsAsync(userId);
                return Ok(refunds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user refunds");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RefundRequestDto>> GetRefundRequest(Guid id)
        {
            try
            {
                var refundRequest = await _refundService.GetRefundRequestAsync(id);
                return Ok(refundRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting refund request");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RefundRequestDto>> ApproveRefund(Guid id, [FromBody] ApproveRefundDto request)
        {
            try
            {
                var adminId = GetUserId();
                var refundRequest = await _refundService.ApproveRefundAsync(id, request, adminId);
                return Ok(refundRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving refund");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RefundRequestDto>> RejectRefund(Guid id, [FromBody] RejectRefundDto request)
        {
            try
            {
                var adminId = GetUserId();
                var refundRequest = await _refundService.RejectRefundAsync(id, request, adminId);
                return Ok(refundRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting refund");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("can-request/{bookingId}")]
        public async Task<ActionResult> CanRequestRefund(Guid bookingId)
        {
            try
            {
                var userId = GetUserId();
                var canRequest = await _refundService.CanRequestRefundAsync(bookingId, userId);
                return Ok(new { canRequest });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking refund eligibility");
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