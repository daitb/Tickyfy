// Controllers/PaymentController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.DTOs.Payment;
using Tickify.Interfaces.Repositories;
using Tickify.Repositories;
using Tickify.Services.Payments;

namespace Tickify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PaymentController : ControllerBase
{
    private readonly IPaymentService _payments;
    public PaymentController(IPaymentService payments) => _payments = payments;

    // POST /api/payments/create-intent
    [HttpPost("create-intent")]
    public async Task<ActionResult<PaymentIntentDto>> CreateIntent([FromBody] CreatePaymentDto dto, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
        var intent = await _payments.CreateAsync(dto, ip, ct);
        return Ok(intent);
    }

    // POST /api/payments/webhook/{provider}  (provider: vnpay|momo)
    [AllowAnonymous]
    [HttpPost("webhook/{provider}")]
    public async Task<IActionResult> Webhook([FromRoute] string provider, CancellationToken ct)
    {
        var ok = await _payments.HandleWebhookAsync(provider, Request, ct);
        return ok ? Ok(new { RspCode = "00", Message = "success" }) : BadRequest();
    }

    // GET /api/payments/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id, [FromServices] IPaymentRepository repo, CancellationToken ct)
        => Ok(await repo.GetAsync(id, ct));

    // GET /api/payments/booking/{bookingId}
    [HttpGet("booking/{bookingId:int}")]
    public async Task<IActionResult> GetByBooking([FromRoute] int bookingId, [FromServices] IPaymentRepository repo, CancellationToken ct)
        => Ok(await repo.ListByBookingAsync(bookingId, ct));

    // POST /api/payments/{id}/verify
    [HttpPost("{id:int}/verify")]
    public async Task<IActionResult> Verify([FromRoute] int id, CancellationToken ct)
        => Ok(new { success = await _payments.VerifyAsync(id, ct) });
}
