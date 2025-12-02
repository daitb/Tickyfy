using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Tickify.Data;
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
    private readonly ITicketRepository _tickets;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<MoMoProvider> _logger;

    public MoMoProvider(
        IOptions<MomoOptionModel> options,
        IHttpClientFactory hf,
        IPaymentRepository payments,
        IBookingRepository bookings,
        ITicketRepository tickets,
        ApplicationDbContext context,
        ILogger<MoMoProvider> logger)
    {
        _opt = options.Value;
        _http = hf.CreateClient();
        _payments = payments;
        _bookings = bookings;
        _tickets = tickets;
        _context = context;
        _logger = logger;
    }

    public async Task<bool> VerifyAsync(int paymentId, CancellationToken ct)
    {
        // Check if payment is completed
        var payment = await _payments.GetAsync(paymentId, ct);
        if (payment == null) return false;
        
        // Get booking to check status
        var booking = await _bookings.GetAsync(payment.BookingId, ct);
        if (booking == null) return false;
        
        // If payment is completed, confirm booking and create tickets if needed
        if (payment.Status == PaymentStatus.Completed)
        {
            // If booking is still pending, confirm it (webhook might have missed)
            if (booking.Status == BookingStatus.Pending)
            {
                booking.Status = BookingStatus.Confirmed;
                booking.ExpiresAt = null;
                await _bookings.UpdateAsync(booking, ct);
                Console.WriteLine($"[MoMo Verify] Confirmed booking {booking.Id} for completed payment {paymentId}");
            }
            
            // Ensure tickets are created if booking is confirmed
            await CreateTicketsForBookingAsync(booking.Id, ct);
            
            return true;
        }
        
        // If booking is already confirmed but payment status is still pending,
        // update payment status to completed (webhook might have processed booking but not payment)
        if (booking.Status == BookingStatus.Confirmed)
        {
            if (payment.Status == PaymentStatus.Pending)
            {
                payment.Status = PaymentStatus.Completed;
                payment.PaidAt = DateTime.UtcNow;
                await _payments.UpdateAsync(payment, ct);
                Console.WriteLine($"[MoMo Verify] Updated payment {paymentId} to Completed for confirmed booking {booking.Id}");
            }
            
            // Ensure tickets are created
            await CreateTicketsForBookingAsync(booking.Id, ct);
            
            return true;
        }
        
        return false;
    }

    public async Task<bool> VerifyFromReturnUrlAsync(int paymentId, IQueryCollection queryParams, CancellationToken ct)
    {
        try
        {
            // MoMo return URL typically doesn't include all the parameters needed for verification
            // We'll check if we have resultCode or errorCode in the query params
            var resultCode = queryParams["resultCode"].ToString();
            var errorCode = queryParams["errorCode"].ToString();
            var orderId = queryParams["orderId"].ToString();
            var amountStr = queryParams["amount"].ToString();
            
            // MoMo trả về amount ở đơn vị VND (số nguyên, không nhân 100)
            if (!long.TryParse(amountStr, out var momoAmount))
            {
                Console.WriteLine($"[MoMo VerifyFromReturnUrl] Invalid amount format: {amountStr}");
                return false;
            }
            var amount = (decimal)momoAmount; // MoMo trả về VND trực tiếp
            
            // Extract paymentId from orderId if needed
            int extractedPaymentId = paymentId;
            if (!string.IsNullOrEmpty(orderId) && orderId.Contains("_"))
            {
                var parts = orderId.Split('_');
                if (parts.Length > 0 && int.TryParse(parts[0], out var parsedId))
                {
                    extractedPaymentId = parsedId;
                }
            }
            
            // Get payment record
            var payment = await _payments.GetAsync(extractedPaymentId, ct);
            if (payment is null)
            {
                Console.WriteLine($"[MoMo VerifyFromReturnUrl] Payment {extractedPaymentId} not found");
                return false;
            }
            
            // Verify amount matches (MoMo trả về ở đơn vị VND)
            var paymentAmountRounded = (long)Math.Round(payment.Amount, 0);
            if (paymentAmountRounded != momoAmount)
            {
                Console.WriteLine($"[MoMo VerifyFromReturnUrl] Amount mismatch. Payment: {payment.Amount} VND (rounded: {paymentAmountRounded}), MoMo: {momoAmount} VND");
                return false;
            }
            
            // Check if we have success indicators
            var isSuccess = (!string.IsNullOrEmpty(resultCode) && resultCode == "0") ||
                           (!string.IsNullOrEmpty(errorCode) && errorCode == "0");
            
            if (isSuccess)
            {
                // Update payment status
                if (payment.Status == PaymentStatus.Pending)
                {
                    payment.Status = PaymentStatus.Completed;
                    payment.PaidAt = DateTime.UtcNow;
                    var transId = queryParams["transId"].ToString();
                    if (!string.IsNullOrEmpty(transId))
                    {
                        payment.TransactionId = transId;
                    }
                    await _payments.UpdateAsync(payment, ct);
                }
                
                // Update booking status
                var booking = await _bookings.GetAsync(payment.BookingId, ct);
                if (booking != null && booking.Status == BookingStatus.Pending)
                {
                    booking.Status = BookingStatus.Confirmed;
                    booking.ExpiresAt = null;
                    await _bookings.UpdateAsync(booking, ct);
                    
                    // Create tickets for the confirmed booking
                    await CreateTicketsForBookingAsync(booking.Id, ct);

                    // Không cần gửi notification vì user đã được redirect về Order Detail
                }
                
                Console.WriteLine($"[MoMo VerifyFromReturnUrl] Payment {extractedPaymentId} completed successfully from return URL");
                return true;
            }
            else
            {
                // If we have explicit failure codes, mark as failed
                if (!string.IsNullOrEmpty(resultCode) && resultCode != "0")
                {
                    payment.Status = PaymentStatus.Failed;
                    await _payments.UpdateAsync(payment, ct);
                    Console.WriteLine($"[MoMo VerifyFromReturnUrl] Payment {extractedPaymentId} failed. Result code: {resultCode}");
                }
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MoMo VerifyFromReturnUrl] Exception: {ex.Message}");
            Console.WriteLine($"[MoMo VerifyFromReturnUrl] StackTrace: {ex.StackTrace}");
            return false;
        }
    }

    public Task<bool> RefundAsync(int paymentId, decimal amount, string reason, CancellationToken ct)
        => Task.FromResult(false); // stub

    public async Task<PaymentIntentDto> CreatePaymentAsync(
        int paymentId, int bookingId, decimal amount, string orderInfo, string clientIp, CancellationToken ct)
    {

        // Validate amount
        if (amount <= 0)
            throw new InvalidOperationException($"Invalid payment amount: {amount}. Amount must be greater than 0");
        
        // MoMo yêu cầu amount là số nguyên VND (không có phần thập phân)
        // Kiểm tra xem amount có phần thập phân không (sau khi làm tròn)
        var roundedAmount = Math.Round(amount, 0);
        if (Math.Abs(amount - roundedAmount) > 0.001m)
        {
            throw new InvalidOperationException($"Invalid payment amount: {amount}. MoMo requires integer VND amount (no decimals). Please round to: {roundedAmount}");
        }

        // MoMo requires unique orderId - combine paymentId with timestamp to ensure uniqueness
        // Format: {paymentId}_{timestamp} (e.g., "24_20251114034500")
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var orderId = $"{paymentId}_{timestamp}";
        var requestId = orderId; // MoMo requires requestId to match orderId

        // MoMo yêu cầu amount là số nguyên VND (không nhân 100)
        // KHÁC VNPay - MoMo sử dụng VND trực tiếp, không phải đơn vị nhỏ nhất
        // Dùng Math.Round để làm tròn về số nguyên VND
        var momoAmount = (long)Math.Round(amount, 0);
        
        // Validate: amount phải > 0 và là số nguyên VND
        if (momoAmount <= 0)
            throw new InvalidOperationException($"Invalid payment amount: {amount}. Amount must be greater than 0");
        
        // MoMo có giới hạn amount tối thiểu (thường là 1000 VND)
        if (momoAmount < 1000)
            throw new InvalidOperationException($"Invalid payment amount: {amount}. MoMo requires minimum 1000 VND");
        
        // Log amount conversion để debug
        Console.WriteLine($"[MoMo] Amount conversion: {amount} VND -> {momoAmount} VND (integer, NOT multiplied by 100)");

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
        Console.WriteLine($"[MoMo] ========== PAYMENT REQUEST ==========");
        Console.WriteLine($"[MoMo] PaymentId: {paymentId}, BookingId: {bookingId}");
        Console.WriteLine($"[MoMo] Original Amount (VND): {amount}");
        Console.WriteLine($"[MoMo] Converted Amount (smallest unit): {momoAmount}");
        Console.WriteLine($"[MoMo] Request URL: {_opt.MomoApiUrl}");
        Console.WriteLine($"[MoMo] Request payload: {requestJson}");
        Console.WriteLine($"[MoMo] ======================================");

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
        
        // MoMo trả về amount ở đơn vị VND (số nguyên, không nhân 100)
        // So sánh với payment.Amount đã làm tròn
        var paymentAmountRounded = (long)Math.Round(payment.Amount, 0);
        if (paymentAmountRounded != amount)
        {
            Console.WriteLine($"[MoMo Webhook] Amount mismatch. Payment: {payment.Amount} VND (rounded: {paymentAmountRounded}), MoMo: {amount} VND");
            return false;
        }

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

                // Create tickets for the confirmed booking
                await CreateTicketsForBookingAsync(booking.Id, ct);

                // Không cần gửi notification vì user đã được redirect về Order Detail
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

    private async Task CreateTicketsForBookingAsync(int bookingId, CancellationToken ct)
    {
        // Get booking with event and existing tickets
        var booking = await _context.Bookings
            .Include(b => b.Event)
            .Include(b => b.Tickets)
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        if (booking == null)
        {
            Console.WriteLine($"[MoMo] Booking {bookingId} not found for ticket creation");
            return;
        }

        // Check if tickets already exist
        if (booking.Tickets != null && booking.Tickets.Any())
        {
            Console.WriteLine($"[MoMo] Tickets already exist for booking {bookingId}");
            return;
        }

        // Get all ticket types for this event
        var ticketTypes = await _context.TicketTypes
            .Where(tt => tt.EventId == booking.EventId && tt.IsActive)
            .ToListAsync(ct);

        if (!ticketTypes.Any())
        {
            Console.WriteLine($"[MoMo] No ticket types found for event {booking.EventId}");
            return;
        }

        // Find the ticket type that matches the booking amount
        // Calculate quantity: TotalAmount / Price (considering discount)
        // We'll use the first ticket type that matches the price per ticket
        var pricePerTicket = booking.TotalAmount + booking.DiscountAmount; // Original total before discount
        TicketType? selectedTicketType = null;
        int quantity = 1;

        // Try to find ticket type by matching price
        foreach (var ticketType in ticketTypes.OrderByDescending(tt => tt.Price))
        {
            var calculatedQuantity = (int)Math.Round(pricePerTicket / ticketType.Price);
            if (calculatedQuantity > 0 && Math.Abs(pricePerTicket - (ticketType.Price * calculatedQuantity)) < 0.01m)
            {
                selectedTicketType = ticketType;
                quantity = calculatedQuantity;
                break;
            }
        }

        // If no exact match, use the most expensive ticket type and calculate quantity
        if (selectedTicketType == null)
        {
            selectedTicketType = ticketTypes.OrderByDescending(tt => tt.Price).First();
            quantity = (int)Math.Ceiling(pricePerTicket / selectedTicketType.Price);
            if (quantity <= 0) quantity = 1;
        }

        // Note: Seat assignment is skipped here because we don't have access to the original
        // SeatIds from CreateBookingDto in the webhook. Seats should be assigned when booking
        // is created or through a separate process. For now, tickets are created without seat assignment.
        // TODO: Store SeatIds in Booking model or create a BookingSeats junction table to track seat assignments.

        // Create tickets
        var ticketsToCreate = new List<Ticket>();
        for (int i = 0; i < quantity; i++)
        {
            var ticket = new Ticket
            {
                BookingId = bookingId,
                TicketTypeId = selectedTicketType.Id,
                TicketCode = GenerateTicketCode(bookingId, i + 1),
                Price = selectedTicketType.Price,
                Status = TicketStatus.Valid,
                CreatedAt = DateTime.UtcNow
            };

            ticketsToCreate.Add(ticket);
        }

        // Bulk create tickets
        await _tickets.CreateBulkAsync(ticketsToCreate);
        Console.WriteLine($"[MoMo] Created {ticketsToCreate.Count} tickets for booking {bookingId}");
    }

    private static string GenerateTicketCode(int bookingId, int ticketNumber)
    {
        return $"TK{bookingId:D6}{ticketNumber:D3}{DateTime.UtcNow:yyyyMMdd}";
    }

    private static string HmacSHA256(string key, string data)
    {
        using var h = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        return BitConverter.ToString(h.ComputeHash(Encoding.UTF8.GetBytes(data)))
                          .Replace("-", "")
                          .ToLowerInvariant();
    }

    // Không cần gửi notification cho payment success/booking confirmed
    // vì user đã được redirect trực tiếp về Order Detail page
    // và thấy kết quả ngay trên UI
}
