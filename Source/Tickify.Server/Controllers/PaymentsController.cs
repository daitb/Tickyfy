// Controllers/PaymentController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Common;
using Tickify.DTOs.Payment;
using Tickify.Interfaces.Repositories;
using Tickify.Models.Momo; 
using Tickify.Services.Payments;
using AutoMapper;

namespace Tickify.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PaymentController : ControllerBase
{
    private readonly IPaymentService _payments;
    private readonly IMapper _mapper;
    public PaymentController(IPaymentService payments, IMapper mapper)
    {
        _payments = payments;
        _mapper = mapper;
    }

    // POST /api/payment/create-intent
    [HttpPost("create-intent")]
    [ProducesResponseType(typeof(ApiResponse<PaymentIntentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ApiResponse<PaymentIntentDto>>> CreateIntent([FromBody] CreatePaymentDto dto, CancellationToken ct)
    {
        try
        {
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
    [AllowAnonymous]
    [HttpPost("webhook/{provider}")]
    public async Task<IActionResult> Webhook([FromRoute] string provider, CancellationToken ct)
    {
        var ok = await _payments.HandleWebhookAsync(provider, Request, ct);
        return ok ? Ok(new { RspCode = "00", Message = "success" }) : BadRequest();
    }

    // GET /api/payment/webhook/{provider}

    [AllowAnonymous]
    [HttpGet("webhook/{provider}")]
    public async Task<IActionResult> WebhookGet([FromRoute] string provider, CancellationToken ct)
    {
        var ok = await _payments.HandleWebhookAsync(provider, Request, ct);
        return ok ? Ok(new { RspCode = "00", Message = "success" }) : BadRequest();
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
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> GetById([FromRoute] int id, [FromServices] IPaymentRepository repo, CancellationToken ct)
    {
        var payment = await repo.GetAsync(id, ct);
        if (payment == null)
        {
            return NotFound(ApiResponse<object>.FailureResponse("Payment not found"));
        }
        var dto = _mapper.Map<PaymentDto>(payment);
        return Ok(ApiResponse<PaymentDto>.SuccessResponse(dto));
    }

    // GET /api/payment/booking/{bookingId}
    [HttpGet("booking/{bookingId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PaymentDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PaymentDto>>>> GetByBooking([FromRoute] int bookingId, [FromServices] IPaymentRepository repo, CancellationToken ct)
    {
        var payments = await repo.ListByBookingAsync(bookingId, ct);
        var dtos = _mapper.Map<IEnumerable<PaymentDto>>(payments);
        return Ok(ApiResponse<IEnumerable<PaymentDto>>.SuccessResponse(dtos));
    }

    // POST /api/payment/{id}/verify
    [HttpPost("{id:int}/verify")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> Verify([FromRoute] int id, CancellationToken ct)
    {
        var success = await _payments.VerifyAsync(id, ct);
        return Ok(ApiResponse<object>.SuccessResponse(
            new { success },
            success ? "Payment verified successfully" : "Payment verification failed"
        ));
    }

    // POST /api/payment/{id}/verify-return-url
    // Verify payment from return URL parameters (when webhook is not received)
    [HttpPost("{id:int}/verify-return-url")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> VerifyFromReturnUrl([FromRoute] int id, CancellationToken ct)
    {
        var success = await _payments.VerifyFromReturnUrlAsync(id, Request.Query, ct);
        return Ok(ApiResponse<object>.SuccessResponse(
            new { success },
            success ? "Payment verified successfully from return URL" : "Payment verification from return URL failed"
        ));
    }
}
