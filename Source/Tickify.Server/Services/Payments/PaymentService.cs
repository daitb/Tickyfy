// Services/Payments/PaymentService.cs
using Tickify.DTOs.Payment;
using Tickify.Extensions;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services.Payments;
public sealed class PaymentService : IPaymentService
{
    private readonly IEnumerable<IPaymentProvider> _providers;
    private readonly IBookingRepository _bookings;
    private readonly IPaymentRepository _payments;
    private readonly IConfiguration _cfg;

    public PaymentService(IEnumerable<IPaymentProvider> providers,
                          IBookingRepository bookings,
                          IPaymentRepository payments,
                          IConfiguration cfg)
    {
        _providers = providers;
        _bookings = bookings;
        _payments = payments;
        _cfg = cfg;
    }

    public async Task<PaymentIntentDto> CreateAsync(CreatePaymentDto dto, string clientIp, CancellationToken ct)
    {
        // Retrieve booking - must exist and be pending
        var booking = await _bookings.GetAsync(dto.BookingId, ct);
        if (booking is null)
            throw new InvalidOperationException($"Booking {dto.BookingId} not found");
        
        if (booking.Status != BookingStatus.Pending)
            throw new InvalidOperationException($"Booking is not pending (current status: {booking.Status})");

        // Calculate final amount (total minus discount)
        // Note: TotalAmount already has discount applied (TotalAmount = totalAmount - discount)
        // So the amount to pay is just TotalAmount
        var amount = booking.TotalAmount;
        
        if (amount < 0)
            throw new InvalidOperationException($"Invalid payment amount: {amount}. Amount cannot be negative");

        // Handle free bookings (amount = 0) - skip payment creation and directly confirm booking
        // Database constraint requires Amount > 0, so we cannot create a payment record for free bookings
        if (amount == 0)
        {
            // Directly confirm the booking without creating a payment record
            booking.Status = BookingStatus.Confirmed;
            booking.ExpiresAt = null;
            await _bookings.UpdateAsync(booking, ct);

            // Return a PaymentIntentDto with redirect to success page
            // Use bookingId as a temporary paymentId for the redirect URL
            var returnUrl = _cfg["Payments:ReturnUrl"] ?? "http://localhost:5173/payment/return";
            var successUrl = $"{returnUrl}?bookingId={booking.Id}&free=true";
            
            return new PaymentIntentDto
            {
                Provider = "Free",
                PaymentId = booking.Id, // Use bookingId as identifier since no payment record exists
                RedirectUrl = successUrl,
                ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15)
            };
        }

        // Find provider - use the one passed in DTO or fall back to default
        if (!_providers.Any())
            throw new InvalidOperationException("No payment providers are configured");

        var provider = _providers.FirstOrDefault(p => p.Name.Equals(dto.Provider, StringComparison.OrdinalIgnoreCase))
                       ?? _providers.FirstOrDefault(p => p.Name.Equals(_cfg["Payments:DefaultProvider"], StringComparison.OrdinalIgnoreCase))
                       ?? _providers.First(); // Fallback to first available

        if (provider is null)
            throw new InvalidOperationException($"Payment provider '{dto.Provider}' not found and no default provider available");

        // Create Payment record with the correct amount (must be > 0 due to database constraint)
        var paymentRow = new Payment
        {
            BookingId = booking.Id,
            Amount = amount,
            Method = dto.Provider.Equals("MoMo", StringComparison.OrdinalIgnoreCase) ? PaymentMethod.Momo : PaymentMethod.VNPay,
            Status = PaymentStatus.Pending,
            PaymentGateway = provider.Name
        };
        
        var newId = await _payments.AddAsync(paymentRow, ct);

        // Call provider to create payment intent with correct amount
        var intent = await provider.CreatePaymentAsync(newId, booking.Id, amount,
                        $"Tickify - Booking {booking.Id}", clientIp, ct);

        return intent;
    }

    public Task<bool> HandleWebhookAsync(string provider, HttpRequest request, CancellationToken ct)
    {
        var providerInstance = _providers.FirstOrDefault(p => p.Name.Equals(provider, StringComparison.OrdinalIgnoreCase));
        if (providerInstance == null)
        {
            Console.WriteLine($"[PaymentService] Provider '{provider}' not found for webhook");
            return Task.FromResult(false);
        }
        return providerInstance.HandleWebhookAsync(request, ct);
    }

    public Task<bool> VerifyAsync(int paymentId, CancellationToken ct)
        => (_providers.First()).VerifyAsync(paymentId, ct);

    public async Task<bool> VerifyFromReturnUrlAsync(int paymentId, IQueryCollection queryParams, CancellationToken ct)
    {
        // Get payment to determine which provider to use
        var payment = await _payments.GetAsync(paymentId, ct);
        if (payment == null)
        {
            Console.WriteLine($"[PaymentService] Payment {paymentId} not found for return URL verification");
            return false;
        }
        
        // Find the provider that matches the payment gateway
        var provider = _providers.FirstOrDefault(p => p.Name.Equals(payment.PaymentGateway, StringComparison.OrdinalIgnoreCase))
                       ?? _providers.FirstOrDefault(p => p.Name.Equals(_cfg["Payments:DefaultProvider"], StringComparison.OrdinalIgnoreCase))
                       ?? _providers.First();
        
        if (provider == null)
        {
            Console.WriteLine($"[PaymentService] No provider found for payment {paymentId}");
            return false;
        }
        
        return await provider.VerifyFromReturnUrlAsync(paymentId, queryParams, ct);
    }

    public async Task<bool> RefundAsync(RefundDto dto, CancellationToken ct)
    {
        var payment = await _payments.GetAsync(dto.PaymentId, ct) ?? throw new InvalidOperationException("Payment not found");
        var provider = _providers.FirstOrDefault(p => p.Name.Equals(payment.PaymentGateway, StringComparison.OrdinalIgnoreCase));
        if (provider == null)
        {
            throw new InvalidOperationException($"Payment provider '{payment.PaymentGateway}' not found for refund");
        }
        return await provider.RefundAsync(payment.Id, dto.Amount, dto.Reason, ct);
    }
}
