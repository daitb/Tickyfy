// Services/Payments/VNPayProvider.cs
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Tickify.DTOs.Payment;
using Tickify.Extensions;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services.Payments;
public sealed class VNPayProvider : IPaymentProvider
{
    public string Name => "VNPay";
    private readonly IConfiguration _cfg;
    private readonly IPaymentRepository _payments;
    private readonly IBookingRepository _bookings;

    public VNPayProvider(IConfiguration cfg, IPaymentRepository payments, IBookingRepository bookings)
    { _cfg = cfg; _payments = payments; _bookings = bookings; }

    public Task<bool> VerifyAsync(int paymentId, CancellationToken ct) =>
        _payments.ExistsAsync(paymentId, PaymentStatus.Completed, ct);

    public Task<bool> RefundAsync(int paymentId, decimal amount, string reason, CancellationToken ct)
        => Task.FromResult(false); // tuỳ hợp đồng, để stub

    public async Task<PaymentIntentDto> CreatePaymentAsync(int paymentId, int bookingId, decimal amount, string orderInfo, string clientIp, CancellationToken ct)
    {
        var baseUrl = _cfg["VNPay:BaseUrl"]!;
        var tmnCode = _cfg["VNPay:TmnCode"]!;
        var secret = _cfg["VNPay:HashSecret"]!;
        var returnUrl = _cfg["Payments:ReturnUrl"]!;
        var ipnUrl = _cfg["VNPay:IpnUrl"]!;
        var expire = DateTime.UtcNow.AddMinutes(int.Parse(_cfg["VNPay:ExpireMinutes"] ?? "15"));

        var dict = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = tmnCode,
            ["vnp_Amount"] = ((long)(amount * 100)).ToString(),
            ["vnp_CreateDate"] = DateTime.UtcNow.ToString("yyyyMMddHHmmss"),
            ["vnp_CurrCode"] = "VND",
            ["vnp_IpAddr"] = clientIp,
            ["vnp_Locale"] = _cfg["VNPay:Locale"] ?? "vn",
            ["vnp_OrderInfo"] = orderInfo,
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = returnUrl,
            ["vnp_TxnRef"] = paymentId.ToString(),  // <— int id
            ["vnp_ExpireDate"] = expire.ToString("yyyyMMddHHmmss"),
            ["vnp_NotifyUrl"] = ipnUrl
        };

        var data = string.Join("&", dict.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
var secureHash = HmacSHA512(secret, data);
var redirect = $"{baseUrl}?{data}&vnp_SecureHash={secureHash}";


        // cập nhật Payment vài trường hiển thị
        var p = await _payments.GetAsync(paymentId, ct);
        if (p != null)
        {
            p.PaymentGateway = Name;
            p.PaymentResponse = $"{{\"redirect\":\"{redirect}\"}}";
            await _payments.UpdateAsync(p, ct);
        }

        return new PaymentIntentDto { Provider = Name, PaymentId = paymentId, RedirectUrl = redirect, ExpiresAtUtc = expire };
    }

    public async Task<bool> HandleWebhookAsync(HttpRequest request, CancellationToken ct)
    {
        var qp = request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
        if (!qp.TryGetValue("vnp_SecureHash", out var providedHash)) return false;

        var filtered = new SortedDictionary<string, string>(
            qp.Where(kv => !kv.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                           !kv.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
              .ToDictionary(k => k.Key, v => v.Value), StringComparer.Ordinal);

        var data = string.Join("&", filtered.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
        var calc = HmacSHA512(_cfg["VNPay:HashSecret"]!, data);
        if (!string.Equals(calc, providedHash, StringComparison.OrdinalIgnoreCase)) return false;

        if (!int.TryParse(filtered["vnp_TxnRef"], out var paymentId)) return false;

        var rspCode = filtered.GetValueOrDefault("vnp_ResponseCode"); // "00" success
        var amount = decimal.Parse(filtered["vnp_Amount"]) / 100m;

        var payment = await _payments.GetAsync(paymentId, ct);
        if (payment is null) return false;
        if (payment.Amount != amount) return false;

        payment.PaymentResponse = System.Text.Json.JsonSerializer.Serialize(filtered);

        if (rspCode == "00")
        {
            payment.Status = PaymentStatus.Completed;
            payment.TransactionId = filtered.GetValueOrDefault("vnp_TransactionNo");
            payment.PaidAt = DateTime.UtcNow;
            await _payments.UpdateAsync(payment, ct);

            var booking = await _bookings.GetAsync(payment.BookingId, ct);
            if (booking != null && booking.Status == BookingStatus.Pending)
            {
                booking.Status = BookingStatus.Confirmed;
                booking.ExpiresAt = null;
                await _bookings.UpdateAsync(booking, ct);
            }
            return true;
        }
        else
        {
            payment.Status = PaymentStatus.Failed;
            await _payments.UpdateAsync(payment, ct);
            return false;
        }
    }

    private static string HmacSHA512(string key, string data)
    {
        using var h = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        return BitConverter.ToString(h.ComputeHash(Encoding.UTF8.GetBytes(data))).Replace("-", string.Empty);
    }
}
