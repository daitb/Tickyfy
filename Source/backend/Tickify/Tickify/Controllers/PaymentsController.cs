using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Tickify.DTOs.Payment;
using Tickify.Services;

namespace Tickify.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

        [HttpPost("create-intent")]
        public async Task<ActionResult<PaymentIntentDto>> CreatePaymentIntent([FromBody] CreatePaymentDto request)
        {
            try
            {
                var result = await _paymentService.CreatePaymentIntentAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment intent");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<ActionResult> PaymentWebhook()
        {
            try
            {
                var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
                
                if (Request.Headers.ContainsKey("Stripe-Signature"))
                {
                    var signature = Request.Headers["Stripe-Signature"].ToString();
                    await _paymentService.ProcessStripeWebhook(json, signature);
                }
                else if (Request.Headers.ContainsKey("PayOS-Signature"))
                {
                    var callback = System.Text.Json.JsonSerializer.Deserialize<PaymentCallbackDto>(json);
                    await _paymentService.ProcessPayOSWebhook(callback);
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment webhook");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentDetailDto>> GetPayment(Guid id)
        {
            try
            {
                var payment = await _paymentService.GetPaymentAsync(id);
                if (payment == null) return NotFound();
                return Ok(payment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult<List<PaymentDetailDto>>> GetPaymentsByBooking(Guid bookingId)
        {
            try
            {
                var payments = await _paymentService.GetPaymentsByBookingAsync(bookingId);
                return Ok(payments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payments by booking");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/verify")]
        public async Task<ActionResult> VerifyPayment(Guid id)
        {
            try
            {
                var isValid = await _paymentService.VerifyPaymentAsync(id);
                return Ok(new { valid = isValid });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying payment");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}