// Services/Payments/IPaymentService.cs
using Microsoft.AspNetCore.Http;
using Tickify.DTOs.Payment;

namespace Tickify.Services.Payments;
public interface IPaymentService
{
    Task<PaymentIntentDto> CreateAsync(CreatePaymentDto dto, string clientIp, CancellationToken ct);
    Task<bool> HandleWebhookAsync(string provider, HttpRequest request, CancellationToken ct);
    Task<bool> VerifyAsync(int paymentId, CancellationToken ct);
    Task<bool> VerifyFromReturnUrlAsync(int paymentId, IQueryCollection queryParams, CancellationToken ct);
    Task<bool> RefundAsync(RefundDto dto, CancellationToken ct);
}
