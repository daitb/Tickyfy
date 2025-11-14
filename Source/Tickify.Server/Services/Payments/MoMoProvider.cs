// Services/Payments/MoMoProvider.cs
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Tickify.DTOs.Payment;
using Tickify.Extensions;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services.Payments;
public sealed class MoMoProvider : IPaymentProvider
{
    public string Name => "MoMo";
    private readonly IConfiguration _cfg;
    private readonly HttpClient _http;
    private readonly IPaymentRepository _payments;
    private readonly IBookingRepository _bookings;

    public MoMoProvider(IConfiguration cfg, IHttpClientFactory hf, IPaymentRepository payments, IBookingRepository bookings)
    { _cfg = cfg; _http = hf.CreateClient(); _payments = payments; _bookings = bookings; }

    public Task<bool> VerifyAsync(int paymentId, CancellationToken ct)
        => _payments.ExistsAsync(paymentId, PaymentStatus.Completed, ct);

    public Task<bool> RefundAsync(int paymentId, decimal amount, string reason, CancellationToken ct)
        => Task.FromResult(false); // để stub

    public async Task<PaymentIntentDto> CreatePaymentAsync(int paymentId, int bookingId, decimal amount, string orderInfo, string clientIp, CancellationToken ct)
    {
        var partnerCode = _cfg["MoMo:PartnerCode"]!;
        var accessKey = _cfg["MoMo:AccessKey"]!;
        var secretKey = _cfg["MoMo:SecretKey"]!;
        var requestType = _cfg["MoMo:RequestType"] ?? "captureWallet";
        var ipnUrl = _cfg["MoMo:IpnUrl"]!;
        var returnUrl = _cfg["Payments:ReturnUrl"]!;
        var endpoint = _cfg["MoMo:Endpoint"]!;
        var requestId = Guid.NewGuid().ToString("N");
        var expire = DateTime.UtcNow.AddMinutes(int.Parse(_cfg["MoMo:ExpireMinutes"] ?? "15"));

        var raw = $"accessKey={accessKey}&amount={(long)amount}&extraData=&ipnUrl={ipnUrl}&orderId={paymentId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={returnUrl}&requestId={requestId}&requestType={requestType}";
        var signature = HmacSHA256(secretKey, raw);

        var payload = new
        {
            partnerCode, accessKey, requestId,
            amount = ((long)amount).ToString(),
            orderId = paymentId.ToString(),
            orderInfo, redirectUrl = returnUrl, ipnUrl,
            requestType, extraData = "", signature, lang = "vi"
        };

        using var resp = await _http.PostAsync(endpoint, new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"), ct);
        var json = await resp.Content.ReadAsStringAsync(ct);
        var doc = JsonDocument.Parse(json).RootElement;

        if (doc.GetProperty("resultCode").GetInt32() != 0)
            throw new InvalidOperationException("MoMo create payment failed");

        var payUrl = doc.GetProperty("payUrl").GetString()!;

        var p = await _payments.GetAsync(paymentId, ct);
        if (p != null)
        {
            p.PaymentGateway = Name;
            p.PaymentResponse = json; // lưu response tạo đơn
            await _payments.UpdateAsync(p, ct);
        }

        return new PaymentIntentDto { Provider = Name, PaymentId = paymentId, RedirectUrl = payUrl, ExpiresAtUtc = expire };
    }

    public async Task<bool> HandleWebhookAsync(HttpRequest request, CancellationToken ct)
    {
        using var reader = new StreamReader(request.Body, Encoding.UTF8);
        var body = await reader.ReadToEndAsync();
        var json = JsonDocument.Parse(body).RootElement;

        var partnerCode = json.GetProperty("partnerCode").GetString();
        var orderId = json.GetProperty("orderId").GetString()!;
        var requestId = json.GetProperty("requestId").GetString();
        var amount = json.GetProperty("amount").GetInt64();
        var transId = json.GetProperty("transId").GetInt64();
        var resultCode = json.GetProperty("resultCode").GetInt32();
        var message = json.GetProperty("message").GetString();
        var signature = json.GetProperty("signature").GetString();
        var responseTime = json.GetProperty("responseTime").GetInt64();

        var accessKey = _cfg["MoMo:AccessKey"]!;
        var secretKey = _cfg["MoMo:SecretKey"]!;
        var raw = $"accessKey={accessKey}&amount={amount}&extraData=&message={message}&orderId={orderId}&orderInfo=&orderType=&partnerCode={partnerCode}&payType=&requestId={requestId}&responseTime={responseTime}&resultCode={resultCode}&transId={transId}";
        var calc = HmacSHA256(secretKey, raw);
        if (!string.Equals(calc, signature, StringComparison.OrdinalIgnoreCase)) return false;

        if (!int.TryParse(orderId, out var paymentId)) return false;

        var payment = await _payments.GetAsync(paymentId, ct);
        if (payment is null) return false;
        if ((long)payment.Amount != amount) return false;

        payment.PaymentResponse = body;

        if (resultCode == 0)
        {
            payment.Status = PaymentStatus.Completed;
            payment.TransactionId = transId.ToString();
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

    private static string HmacSHA256(string key, string data)
    {
        using var h = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        return BitConverter.ToString(h.ComputeHash(Encoding.UTF8.GetBytes(data))).Replace("-", "").ToLowerInvariant();
    }
}
