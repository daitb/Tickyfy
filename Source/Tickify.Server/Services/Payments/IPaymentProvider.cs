// Services/Payments/IPaymentProvider.cs
using Microsoft.AspNetCore.Http;
using Tickify.DTOs.Payment;

namespace Tickify.Services.Payments;
public interface IPaymentProvider
{
    string Name { get; }
    Task<PaymentIntentDto> CreatePaymentAsync(int paymentId, int bookingId, decimal amount, string orderInfo, string clientIp, CancellationToken ct);
    Task<bool> HandleWebhookAsync(HttpRequest request, CancellationToken ct); // cập nhật Payment/Booking
    Task<bool> VerifyAsync(int paymentId, CancellationToken ct);
    Task<bool> VerifyFromReturnUrlAsync(int paymentId, IQueryCollection queryParams, CancellationToken ct); // Verify from return URL parameters
    Task<bool> RefundAsync(int paymentId, decimal amount, string reason, CancellationToken ct);
}
