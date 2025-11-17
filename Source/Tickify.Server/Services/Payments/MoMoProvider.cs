using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Tickify.DTOs.Payment;
using Tickify.Extensions;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
using Tickify.Models.Momo;
using Tickify.Repositories;

namespace Tickify.Services.Payments;

public sealed class MoMoProvider : IPaymentProvider
{
    public string Name => "MoMo";

    private readonly MomoOptionModel _opt;
    private readonly HttpClient _http;
    private readonly IPaymentRepository _payments;
    private readonly IBookingRepository _bookings;

    public MoMoProvider(
        IOptions<MomoOptionModel> options,
        IHttpClientFactory hf,
        IPaymentRepository payments,
        IBookingRepository bookings)
    {
        _opt = options.Value;
        _http = hf.CreateClient();
        _payments = payments;
        _bookings = bookings;
    }

    public Task<bool> VerifyAsync(int paymentId, CancellationToken ct)
        => _payments.ExistsAsync(paymentId, PaymentStatus.Completed, ct);

    public Task<bool> RefundAsync(int paymentId, decimal amount, string reason, CancellationToken ct)
        => Task.FromResult(false); // stub

    public async Task<PaymentIntentDto> CreatePaymentAsync(
        int paymentId, int bookingId, decimal amount, string orderInfo, string clientIp, CancellationToken ct)
    {

        // Validate amount
        if (amount <= 0)
            throw new InvalidOperationException($"Invalid payment amount: {amount}. Amount must be greater than 0");

        // MoMo requires unique orderId - combine paymentId with timestamp to ensure uniqueness
        // Format: {paymentId}_{timestamp} (e.g., "24_20251114034500")
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var orderId = $"{paymentId}_{timestamp}";
        var requestId = orderId; // MoMo requires requestId to match orderId

        // MoMo requires amount as integer (in VND, smallest unit)
        // Amount is already in VND, so we convert to long (remove decimals)
        var momoAmount = (long)Math.Round(amount, 0);

        var raw = $"partnerCode={_opt.PartnerCode}"
                + $"&accessKey={_opt.AccessKey}"
                + $"&requestId={requestId}"
                + $"&amount={momoAmount}"
                + $"&orderId={orderId}"
                + $"&orderInfo={orderInfo}"
                + $"&returnUrl={_opt.ReturnUrl}"
                + $"&notifyUrl={_opt.NotifyUrl}"
                + $"&extraData=";

        var signature = HmacSHA256(_opt.SecretKey, raw);

        var payload = new
        {
            accessKey = _opt.AccessKey,
            partnerCode = _opt.PartnerCode,
            requestType = _opt.RequestType,   // "captureMoMoWallet"
            notifyUrl = _opt.NotifyUrl,
            returnUrl = _opt.ReturnUrl,
            orderId = orderId,
            amount = momoAmount.ToString(),
            orderInfo = orderInfo,
            requestId = requestId,
            extraData = "",
            signature = signature
        };

        // Log request for debugging
        var requestJson = JsonSerializer.Serialize(payload);
        Console.WriteLine($"[MoMo] Creating payment - PaymentId: {paymentId}, Amount: {amount}");
        Console.WriteLine($"[MoMo] Request URL: {_opt.MomoApiUrl}");
        Console.WriteLine($"[MoMo] Request payload: {requestJson}");

        using var resp = await _http.PostAsync(
            _opt.MomoApiUrl,
            new StringContent(requestJson, Encoding.UTF8, "application/json"),
            ct);

        var json = await resp.Content.ReadAsStringAsync(ct);
        Console.WriteLine($"[MoMo] Response status: {resp.StatusCode}");
        Console.WriteLine($"[MoMo] Response body: {json}");

        if (!resp.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"MoMo API returned status {resp.StatusCode}: {json}");
        }

        var respModel = JsonSerializer.Deserialize<MomoCreatePaymentResponseModel>(json);

        if (respModel == null)
        {
            throw new InvalidOperationException($"MoMo API returned invalid response: {json}");
        }

        // Check ErrorCode or ResultCode (MoMo may return either)
        // Success if ErrorCode == 0 OR ResultCode == 0
        var errorCode = respModel.ErrorCode ?? -1;
        var resultCode = respModel.ResultCode ?? -1;
        
        Console.WriteLine($"[MoMo] Checking response - ErrorCode: {errorCode}, ResultCode: {resultCode}");
        
        // Success if either ErrorCode is 0 (and ResultCode is not set) OR ResultCode is 0
        var ok = errorCode == 0 || resultCode == 0;
        
        Console.WriteLine($"[MoMo] Success check result: {ok} (errorCode == 0: {errorCode == 0}, resultCode == 0: {resultCode == 0})");

        if (!ok)
        {
            var errorMessage = respModel.Message ?? respModel.LocalMessage ?? "Unknown error";
            Console.WriteLine($"[MoMo] Payment failed - ErrorCode: {errorCode}, ResultCode: {resultCode}, Message: {errorMessage}");
            throw new InvalidOperationException(
                $"MoMo create payment failed. ErrorCode: {errorCode}, ResultCode: {resultCode}, Message: {errorMessage}. Full response: {json}");
        }
        
        Console.WriteLine($"[MoMo] Payment validation passed - ErrorCode: {errorCode}, ResultCode: {resultCode}");

        var payUrl = respModel.PayUrl;
        if (string.IsNullOrWhiteSpace(payUrl))
        {
            throw new InvalidOperationException($"MoMo create payment: payUrl missing. Full response: {json}");
        }

        Console.WriteLine($"[MoMo] Payment created successfully. PayUrl: {payUrl}");

        // lưu response
        var p = await _payments.GetAsync(paymentId, ct);
        if (p != null)
        {
            p.PaymentGateway = Name;
            p.PaymentResponse = json;
            await _payments.UpdateAsync(p, ct);
        }


        // MoMo không trả expire → set 15'
        var expire = DateTime.UtcNow.AddMinutes(15);

        return new PaymentIntentDto
        {
            Provider = Name,
            PaymentId = paymentId,
            RedirectUrl = payUrl!,
            ExpiresAtUtc = expire
        };
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

        // dùng options thay vì IConfiguration
        var accessKey = _opt.AccessKey;
        var secretKey = _opt.SecretKey;

        var raw = $"accessKey={accessKey}&amount={amount}&extraData=&message={message}&orderId={orderId}&orderInfo=&orderType=&partnerCode={partnerCode}&payType=&requestId={requestId}&responseTime={responseTime}&resultCode={resultCode}&transId={transId}";
        var calc = HmacSHA256(secretKey, raw);
        if (!string.Equals(calc, signature, StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine($"[MoMo Webhook] Hash mismatch. Calculated: {calc}, Provided: {signature}");
            return false;
        }

        // Extract paymentId from orderId
        // orderId format: {paymentId}_{timestamp} (e.g., "24_20251114034500")
        int paymentId;
        if (orderId.Contains("_"))
        {
            // New format: extract paymentId from "paymentId_timestamp"
            var parts = orderId.Split('_');
            if (parts.Length > 0 && int.TryParse(parts[0], out paymentId))
            {
                // Successfully extracted paymentId
            }
            else
            {
                Console.WriteLine($"[MoMo Webhook] Invalid orderId format: {orderId}");
                return false;
            }
        }
        else
        {
            // Old format: orderId is just paymentId (backward compatibility)
            if (!int.TryParse(orderId, out paymentId))
            {
                Console.WriteLine($"[MoMo Webhook] Invalid orderId: {orderId}");
                return false;
            }
        }

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
        return BitConverter.ToString(h.ComputeHash(Encoding.UTF8.GetBytes(data)))
                          .Replace("-", "")
                          .ToLowerInvariant();
    }
}
