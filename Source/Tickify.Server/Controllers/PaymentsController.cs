// Controllers/PaymentController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Tickify.Common;
using Tickify.DTOs.Payment;
using Tickify.Interfaces.Repositories;
using Tickify.Models.Momo; 
using Tickify.Services.Payments;
using AutoMapper;

namespace Tickify.Controllers;

[ApiController]
[Route("api/payments")]
public sealed class PaymentController : ControllerBase
{
    private readonly IPaymentService _payments;
    private readonly IMapper _mapper;
    private readonly IBookingRepository _bookingRepository;
    private readonly IPaymentRepository _paymentRepository;
    private readonly ILogger<PaymentController> _logger;
    
    public PaymentController(
        IPaymentService payments, 
        IMapper mapper,
        IBookingRepository bookingRepository,
        IPaymentRepository paymentRepository,
        ILogger<PaymentController> logger)
    {
        _payments = payments;
        _mapper = mapper;
        _bookingRepository = bookingRepository;
        _paymentRepository = paymentRepository;
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
    /// Check if user owns the booking
    /// </summary>
    private async Task<bool> UserOwnsBookingAsync(int bookingId, int userId, CancellationToken ct)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        return booking != null && booking.UserId == userId;
    }

    /// <summary>
    /// Check if user owns the payment (through booking)
    /// </summary>
    private async Task<bool> UserOwnsPaymentAsync(int paymentId, int userId, CancellationToken ct)
    {
        var payment = await _paymentRepository.GetAsync(paymentId, ct);
        if (payment == null) return false;
        
        var booking = await _bookingRepository.GetByIdAsync(payment.BookingId);
        return booking != null && booking.UserId == userId;
    }

    // POST /api/payment/create-intent
    [HttpPost("create-intent")]
    [Authorize] // Require authentication
    [ProducesResponseType(typeof(ApiResponse<PaymentIntentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<PaymentIntentDto>>> CreateIntent([FromBody] CreatePaymentDto dto, CancellationToken ct)
    {
        try
        {
            // Authorization: Verify user owns the booking
            var userId = GetCurrentUserId();
            var ownsBooking = await UserOwnsBookingAsync(dto.BookingId, userId, ct);
            if (!ownsBooking)
            {
                _logger.LogWarning($"[PaymentController] User {userId} attempted to create payment for booking {dto.BookingId} they don't own");
                return Forbid();
            }

            // Get client IP address - prioritize X-Forwarded-For or X-Real-IP headers (for proxies/load balancers)
            // Then fall back to RemoteIpAddress
            string? ip = null;
            
            // Try X-Forwarded-For header first (most common for proxied requests)
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                // X-Forwarded-For can contain multiple IPs, take the first one
                var forwardedIp = forwardedFor.Split(',').FirstOrDefault()?.Trim();
                if (!string.IsNullOrEmpty(forwardedIp) && System.Net.IPAddress.TryParse(forwardedIp, out var parsedIp))
                {
                    // Only use IPv4 addresses (VNPAY doesn't accept IPv6)
                    if (!parsedIp.ToString().Contains(":"))
                    {
                        ip = parsedIp.ToString();
                    }
                }
            }
            
            // Try X-Real-IP header (alternative header)
            if (string.IsNullOrEmpty(ip))
            {
                var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
                if (!string.IsNullOrEmpty(realIp) && System.Net.IPAddress.TryParse(realIp, out var parsedRealIp))
                {
                    if (!parsedRealIp.ToString().Contains(":"))
                    {
                        ip = parsedRealIp.ToString();
                    }
                }
            }
            
            // Fall back to RemoteIpAddress
            if (string.IsNullOrEmpty(ip))
            {
                var remoteIp = HttpContext.Connection.RemoteIpAddress;
                if (remoteIp != null)
                {
                    var ipString = remoteIp.ToString();
                    // Convert IPv6 localhost to IPv4
                    if (ipString == "::1" || ipString == "0:0:0:0:0:0:0:1")
                    {
                        ip = "127.0.0.1";
                    }
                    // If it's IPv6, use localhost as fallback
                    else if (ipString.Contains(":"))
                    {
                        ip = "127.0.0.1";
                    }
                    else
                    {
                        ip = ipString;
                    }
                }
            }
            
            // Final fallback to localhost
            if (string.IsNullOrEmpty(ip))
            {
                ip = "127.0.0.1";
            }
            
            Console.WriteLine($"[PaymentController] Detected client IP: {ip} (from X-Forwarded-For: {forwardedFor}, RemoteIpAddress: {HttpContext.Connection.RemoteIpAddress})");
            
            var intent = await _payments.CreateAsync(dto, ip, ct);
            return Ok(ApiResponse<PaymentIntentDto>.SuccessResponse(intent, "Payment intent created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            // Log the error for debugging
            Console.WriteLine($"[PaymentController] InvalidOperationException: {ex.Message}");
            Console.WriteLine($"[PaymentController] StackTrace: {ex.StackTrace}");
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            // Log the full exception for debugging
            Console.WriteLine($"[PaymentController] Exception: {ex.Message}");
            Console.WriteLine($"[PaymentController] StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[PaymentController] InnerException: {ex.InnerException.Message}");
            }
            return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
        }
    }

    // POST /api/payment/webhook/{provider}  (provider: vnpay|momo)
    // Note: Webhooks must be AllowAnonymous as they come from external payment gateways
    // Security is handled by signature verification in the provider implementations
    [AllowAnonymous]
    [HttpPost("webhook/{provider}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Webhook(
        [FromRoute] [Required] [StringLength(20)] string provider, 
        CancellationToken ct)
    {
        // Validate provider name
        if (string.IsNullOrWhiteSpace(provider) || 
            !provider.Equals("vnpay", StringComparison.OrdinalIgnoreCase) && 
            !provider.Equals("momo", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning($"[PaymentController] Invalid webhook provider: {provider}");
            return BadRequest(new { RspCode = "01", Message = "Invalid provider" });
        }

        var ok = await _payments.HandleWebhookAsync(provider, Request, ct);
        return ok ? Ok(new { RspCode = "00", Message = "success" }) : BadRequest(new { RspCode = "01", Message = "Webhook verification failed" });
    }

    // GET /api/payment/webhook/{provider}
    // Some payment gateways may use GET for webhooks
    [AllowAnonymous]
    [HttpGet("webhook/{provider}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> WebhookGet(
        [FromRoute] [Required] [StringLength(20)] string provider, 
        CancellationToken ct)
    {
        // Validate provider name
        if (string.IsNullOrWhiteSpace(provider) || 
            !provider.Equals("vnpay", StringComparison.OrdinalIgnoreCase) && 
            !provider.Equals("momo", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning($"[PaymentController] Invalid webhook provider: {provider}");
            return BadRequest(new { RspCode = "01", Message = "Invalid provider" });
        }

        var ok = await _payments.HandleWebhookAsync(provider, Request, ct);
        return ok ? Ok(new { RspCode = "00", Message = "success" }) : BadRequest(new { RspCode = "01", Message = "Webhook verification failed" });
    }

    // GET /api/payments/momo-return
    // FE có thể gọi endpoint này sau khi người dùng quay về từ MoMo (ReturnUrl)

    [AllowAnonymous]
    [HttpGet("momo-return")]
    public IActionResult MomoReturn()
    {
        var q = Request.Query;
        var model = new MomoExecuteResponseModel
        {
            OrderId    = q["orderId"],
            Amount     = long.TryParse(q["amount"], out var a) ? a : null,
            OrderInfo  = q["orderInfo"],
            Message    = q["message"],
            ResultCode = int.TryParse(q["resultCode"], out var rc) ? rc : null
        };
        return Ok(model);
    }

    // GET /api/payment/{id}
    [HttpGet("{id:int}")]
    [Authorize] // Require authentication
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> GetById([FromRoute] int id, CancellationToken ct)
    {
        // Authorization: Verify user owns the payment
        var userId = GetCurrentUserId();
        var ownsPayment = await UserOwnsPaymentAsync(id, userId, ct);
        if (!ownsPayment)
        {
            _logger.LogWarning($"[PaymentController] User {userId} attempted to access payment {id} they don't own");
            return Forbid();
        }

        var payment = await _paymentRepository.GetAsync(id, ct);
        if (payment == null)
        {
            return NotFound(ApiResponse<object>.FailureResponse("Payment not found"));
        }
        var dto = _mapper.Map<PaymentDto>(payment);
        return Ok(ApiResponse<PaymentDto>.SuccessResponse(dto));
    }

    // GET /api/payment/booking/{bookingId}
    [HttpGet("booking/{bookingId:int}")]
    [Authorize] // Require authentication
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PaymentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PaymentDto>>>> GetByBooking([FromRoute] int bookingId, CancellationToken ct)
    {
        // Authorization: Verify user owns the booking
        var userId = GetCurrentUserId();
        var ownsBooking = await UserOwnsBookingAsync(bookingId, userId, ct);
        if (!ownsBooking)
        {
            _logger.LogWarning($"[PaymentController] User {userId} attempted to access payments for booking {bookingId} they don't own");
            return Forbid();
        }

        var payments = await _paymentRepository.ListByBookingAsync(bookingId, ct);
        var dtos = _mapper.Map<IEnumerable<PaymentDto>>(payments);
        return Ok(ApiResponse<IEnumerable<PaymentDto>>.SuccessResponse(dtos));
    }

    // POST /api/payment/{id}/verify
    [HttpPost("{id:int}/verify")]
    [Authorize] // Require authentication
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<object>>> Verify([FromRoute] int id, CancellationToken ct)
    {
        // Authorization: Verify user owns the payment
        var userId = GetCurrentUserId();
        var ownsPayment = await UserOwnsPaymentAsync(id, userId, ct);
        if (!ownsPayment)
        {
            _logger.LogWarning($"[PaymentController] User {userId} attempted to verify payment {id} they don't own");
            return Forbid();
        }

        var success = await _payments.VerifyAsync(id, ct);
        return Ok(ApiResponse<object>.SuccessResponse(
            new { success },
            success ? "Payment verified successfully" : "Payment verification failed"
        ));
    }

    // POST /api/payment/{id}/verify-return-url
    // Verify payment from return URL parameters (when webhook is not received)
    // Note: This endpoint is AllowAnonymous because payment gateways redirect users here
    // However, we validate the payment ID format and limit abuse through rate limiting
    [HttpPost("{id:int}/verify-return-url")]
    [AllowAnonymous] // Payment gateways redirect here, so we can't require auth
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> VerifyFromReturnUrl([FromRoute] int id, CancellationToken ct)
    {
        // Validate payment ID
        if (id <= 0)
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Invalid payment ID"));
        }

        // Validate query parameters are present (basic check)
        if (!Request.Query.Any())
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Missing payment verification parameters"));
        }

        var success = await _payments.VerifyFromReturnUrlAsync(id, Request.Query, ct);
        return Ok(ApiResponse<object>.SuccessResponse(
            new { success },
            success ? "Payment verified successfully from return URL" : "Payment verification from return URL failed"
        ));
    }
}
