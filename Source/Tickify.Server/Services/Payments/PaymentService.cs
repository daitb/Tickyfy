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
        var booking = await _bookings.GetAsync(dto.BookingId, ct) ?? throw new InvalidOperationException("Booking not found");
        if (booking.Status != BookingStatus.Pending) throw new InvalidOperationException("Booking not pending");

        var provider = _providers.FirstOrDefault(p => p.Name.Equals(dto.Provider, StringComparison.OrdinalIgnoreCase))
                       ?? _providers.First(p => p.Name.Equals(_cfg["Payments:DefaultProvider"], StringComparison.OrdinalIgnoreCase));

        // 1) tạo bản ghi Payment trước để có Id (int)
        var paymentRow = new Payment {
            BookingId = booking.Id,
            Amount = booking.TotalAmount,
            Method = dto.Provider.Equals("MoMo", StringComparison.OrdinalIgnoreCase) ? PaymentMethod.Momo : PaymentMethod.VNPay,
            Status = PaymentStatus.Pending,
            PaymentGateway = provider.Name
        };
        var newId = await _payments.AddAsync(paymentRow, ct);

        // 2) gọi provider, truyền paymentId (int) làm mã đối soát với gateway
        var intent = await provider.CreatePaymentAsync(newId, booking.Id, booking.TotalAmount,
                        $"Tickify - Booking {booking.Id}", clientIp, ct);

        return intent; // RedirectUrl + ExpiresAtUtc + Provider + PaymentId
    }

    public Task<bool> HandleWebhookAsync(string provider, HttpRequest request, CancellationToken ct)
        => (_providers.First(p => p.Name.Equals(provider, StringComparison.OrdinalIgnoreCase)))
           .HandleWebhookAsync(request, ct);

    public Task<bool> VerifyAsync(int paymentId, CancellationToken ct)
        => (_providers.First()).VerifyAsync(paymentId, ct);

    public async Task<bool> RefundAsync(RefundDto dto, CancellationToken ct)
    {
        var payment = await _payments.GetAsync(dto.PaymentId, ct) ?? throw new InvalidOperationException("Payment not found");
        var provider = _providers.First(p => p.Name.Equals(payment.PaymentGateway, StringComparison.OrdinalIgnoreCase));
        return await provider.RefundAsync(payment.Id, dto.Amount, dto.Reason, ct);
    }
}
