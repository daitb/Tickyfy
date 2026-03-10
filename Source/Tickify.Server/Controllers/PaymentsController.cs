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

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }
        return userId;
    }

    private async Task<bool> UserOwnsBookingAsync(int bookingId, int userId, CancellationToken ct)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId);
        return booking != null && booking.UserId == userId;
    }

    private async Task<bool> UserOwnsPaymentAsync(int paymentId, int userId, CancellationToken ct)
    {
        var payment = await _paymentRepository.GetAsync(paymentId, ct);
        if (payment == null) return false;
        
        var booking = await _bookingRepository.GetByIdAsync(payment.BookingId);
        return booking != null && booking.UserId == userId;
    }

    [HttpPost("create-intent")]
    [Authorize]
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

            string? ip = null;
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                var forwardedIp = forwardedFor.Split(',').FirstOrDefault()?.Trim();
                if (!string.IsNullOrEmpty(forwardedIp) && System.Net.IPAddress.TryParse(forwardedIp, out var parsedIp))
                {
                    if (!parsedIp.ToString().Contains(":"))
                    {
                        ip = parsedIp.ToString();
                    }
                }
            }
            
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
            
            if (string.IsNullOrEmpty(ip))
            {
                var remoteIp = HttpContext.Connection.RemoteIpAddress;
                if (remoteIp != null)
                {
                    var ipString = remoteIp.ToString();
                    if (ipString == "::1" || ipString == "0:0:0:0:0:0:0:1")
                    {
                        ip = "127.0.0.1";
                    }
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
            Console.WriteLine($"[PaymentController] InvalidOperationException: {ex.Message}");
            Console.WriteLine($"[PaymentController] StackTrace: {ex.StackTrace}");
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PaymentController] Exception: {ex.Message}");
            Console.WriteLine($"[PaymentController] StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[PaymentController] InnerException: {ex.InnerException.Message}");
            }
            return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
        }
    }

    [HttpPost("create-credit-card-intent")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<CreditCardPaymentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<CreditCardPaymentResponseDto>>> CreateCreditCardIntent(
        [FromBody] CreditCardPaymentDto dto, 
        CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("[PaymentController] Processing credit card payment for booking {BookingId}", dto.BookingId);

            // Authorization check
            var userId = GetCurrentUserId();
            var ownsBooking = await UserOwnsBookingAsync(dto.BookingId, userId, ct);
            if (!ownsBooking)
            {
                _logger.LogWarning("[PaymentController] User {UserId} attempted unauthorized credit card payment for booking {BookingId}", 
                    userId, dto.BookingId);
                return Forbid();
            }

            // Comprehensive validation using validator
            var (isValid, errorMessage) = Validators.CreditCardValidator.ValidateCardDetails(dto);
            if (!isValid)
            {
                _logger.LogWarning("[PaymentController] Card validation failed: {Error}", errorMessage);
                return BadRequest(ApiResponse<object>.FailureResponse(errorMessage));
            }

            // Detect card brand for logging and response
            var cardBrand = Validators.CreditCardValidator.DetectCardBrand(dto.CardNumber);
            var maskedCard = Validators.CreditCardValidator.MaskCardNumber(dto.CardNumber);
            var last4 = Validators.CreditCardValidator.GetLast4Digits(dto.CardNumber);

            _logger.LogInformation("[PaymentController] Card validated - Brand: {Brand}, Masked: {Masked}", 
                cardBrand, maskedCard);

            // Get booking to check amount
            var booking = await _bookingRepository.GetByIdAsync(dto.BookingId);
            if (booking == null)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("Booking không tồn tại"));
            }

            // Simulate fraud check
            var (fraudPassed, fraudReason) = Validators.CreditCardValidator.SimulateFraudCheck(
                dto.CardNumber, 
                booking.TotalAmount,
                dto.BillingCountry
            );

            if (!fraudPassed)
            {
                _logger.LogWarning("[PaymentController] Fraud check failed: {Reason}", fraudReason);
                return BadRequest(ApiResponse<object>.FailureResponse(fraudReason ?? "Giao dịch bị từ chối"));
            }

            // Get client IP
            var ip = GetClientIp();
            
            // Create payment intent using standard flow
            var createDto = new CreatePaymentDto
            {
                BookingId = dto.BookingId,
                Provider = "creditcard"
            };

            var intent = await _payments.CreateAsync(createDto, ip, ct);
            
            // Build comprehensive response
            var response = new CreditCardPaymentResponseDto
            {
                PaymentId = intent.PaymentId,
                TransactionId = intent.TransactionId ?? "N/A",
                Status = "Completed",
                Amount = booking.TotalAmount,
                Currency = "VND",
                CardBrand = cardBrand,
                Last4Digits = last4,
                ProcessedAt = DateTime.UtcNow,
                Message = "Thanh toán thành công qua thẻ tín dụng",
                AuthorizationCode = Validators.CreditCardValidator.GenerateAuthorizationCode(),
                ReceiptUrl = intent.RedirectUrl,
                IsImmediateCompletion = true,
                BookingId = booking.Id
            };

            _logger.LogInformation("[PaymentController] Credit card payment successful - PaymentId: {PaymentId}, TxnId: {TxnId}, Brand: {Brand}", 
                intent.PaymentId, response.TransactionId, cardBrand);

            return Ok(ApiResponse<CreditCardPaymentResponseDto>.SuccessResponse(
                response, 
                $"Thanh toán thành công {booking.TotalAmount:N0} VND qua thẻ {cardBrand}"
            ));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "[PaymentController] Credit card payment failed");
            return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[PaymentController] Credit card payment error");
            return StatusCode(500, ApiResponse<object>.FailureResponse($"Lỗi xử lý thanh toán: {ex.Message}"));
        }
    }

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

    [AllowAnonymous]
    [HttpGet("vnpay-return")]
    public IActionResult VNPayReturn()
    {
        var q = Request.Query;
        var model = new
        {
            vnp_TxnRef = q["vnp_TxnRef"],
            vnp_Amount = q["vnp_Amount"],
            vnp_OrderInfo = q["vnp_OrderInfo"],
            vnp_ResponseCode = q["vnp_ResponseCode"],
            vnp_TransactionNo = q["vnp_TransactionNo"],
            vnp_TransactionStatus = q["vnp_TransactionStatus"],
            vnp_SecureHash = q["vnp_SecureHash"]
        };
        return Ok(model);
    }

    [HttpGet("{id:int}")]
    [Authorize]
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

    [HttpGet("booking/{bookingId:int}")]
    [Authorize]
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

    [HttpPost("{id:int}/verify")]
    [Authorize]
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

    [HttpPost("{id:int}/verify-return-url")]
    [AllowAnonymous]
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

    private string GetClientIp()
    {
        string? ip = null;
        
        var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            var forwardedIp = forwardedFor.Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrEmpty(forwardedIp) && System.Net.IPAddress.TryParse(forwardedIp, out var parsedIp))
            {
                if (!parsedIp.ToString().Contains(":"))
                    ip = parsedIp.ToString();
            }
        }
        
        if (string.IsNullOrEmpty(ip))
        {
            var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp) && System.Net.IPAddress.TryParse(realIp, out var parsedRealIp))
            {
                if (!parsedRealIp.ToString().Contains(":"))
                    ip = parsedRealIp.ToString();
            }
        }
        
        if (string.IsNullOrEmpty(ip))
        {
            var remoteIp = HttpContext.Connection.RemoteIpAddress;
            if (remoteIp != null)
            {
                var ipString = remoteIp.ToString();
                if (ipString == "::1" || ipString == "0:0:0:0:0:0:0:1")
                    ip = "127.0.0.1";
                else if (!ipString.Contains(":"))
                    ip = ipString;
                else
                    ip = "127.0.0.1";
            }
            else
            {
                ip = "127.0.0.1";
            }
        }
        
        return ip;
    }
}
