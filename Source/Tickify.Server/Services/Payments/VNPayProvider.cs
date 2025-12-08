using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Payment;
using Tickify.Extensions;
using Tickify.Hubs;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services.Payments;
public sealed class VNPayProvider : IPaymentProvider
{
    public string Name => "VNPay";
    private readonly IConfiguration _cfg;
    private readonly IPaymentRepository _payments;
    private readonly IBookingRepository _bookings;
    private readonly ITicketRepository _tickets;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VNPayProvider> _logger;
    private readonly IHubContext<SeatHub> _seatHubContext;

    public VNPayProvider(
        IConfiguration cfg, 
        IPaymentRepository payments, 
        IBookingRepository bookings,
        ITicketRepository tickets,
        ApplicationDbContext context,
        INotificationService notificationService,
        ILogger<VNPayProvider> logger,
        IHubContext<SeatHub> seatHubContext)
    { 
        _cfg = cfg; 
        _payments = payments; 
        _bookings = bookings;
        _tickets = tickets;
        _context = context;
        _logger = logger;
        _seatHubContext = seatHubContext;
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
                _logger.LogInformation("[VNPay Verify] Confirmed booking {BookingId} for completed payment {PaymentId}", booking.Id, paymentId);
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
                _logger.LogInformation("[VNPay Verify] Updated payment {PaymentId} to Completed for confirmed booking {BookingId}", paymentId, booking.Id);
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
            // Convert query collection to dictionary
            var qp = queryParams.ToDictionary(k => k.Key, v => v.Value.ToString());
            
            // Extract actual paymentId from vnp_TxnRef (format: "paymentId_timestamp")
            var txnRef = qp.GetValueOrDefault("vnp_TxnRef", "");
            int actualPaymentId = paymentId;
            
            if (!string.IsNullOrEmpty(txnRef) && txnRef.Contains("_"))
            {
                var parts = txnRef.Split('_');
                if (parts.Length > 0 && int.TryParse(parts[0], out var extractedId))
                {
                    actualPaymentId = extractedId;
                    _logger.LogInformation("[VNPay VerifyFromReturnUrl] Extracted paymentId {PaymentId} from vnp_TxnRef {TxnRef}", actualPaymentId, txnRef);
                }
            }
            
            if (!qp.TryGetValue("vnp_SecureHash", out var providedHash) || string.IsNullOrWhiteSpace(providedHash))
            {
                _logger.LogWarning("[VNPay VerifyFromReturnUrl] Missing vnp_SecureHash parameter");
                return false;
            }

            // Filter out hash parameters for hash calculation
            var filtered = new SortedDictionary<string, string>(
                qp.Where(kv => !kv.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                               !kv.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
                  .ToDictionary(k => k.Key, v => v.Value), StringComparer.Ordinal);

            // Build query string for hash verification
            // According to VNPay documentation: hash is calculated from URL-encoded query string
            // When receiving from return URL, values are already URL-decoded by ASP.NET
            // So we need to URL-encode them again to match the original hash calculation
            var data = string.Join("&", filtered.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
            
            // Get hash type (default to SHA512 as per VNPay documentation)
            var hashType = qp.GetValueOrDefault("vnp_SecureHashType", "SHA512");
            var secret = _cfg["VNPay:HashSecret"];
            if (string.IsNullOrWhiteSpace(secret))
            {
                _logger.LogError("[VNPay VerifyFromReturnUrl] HashSecret is not configured");
                return false;
            }
            
            string calc;
            if (hashType.Equals("SHA512", StringComparison.OrdinalIgnoreCase))
            {
                calc = HmacSHA512(secret, data);
            }
            else if (hashType.Equals("SHA256", StringComparison.OrdinalIgnoreCase))
            {
                calc = HmacSHA256(secret, data);
            }
            else
            {
                // Default to SHA512 if unknown type
                _logger.LogWarning("[VNPay VerifyFromReturnUrl] Unknown hash type: {HashType}, defaulting to SHA512", hashType);
                calc = HmacSHA512(secret, data);
            }
            
            // Verify hash
            if (!string.Equals(calc, providedHash, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("[VNPay VerifyFromReturnUrl] Hash mismatch. Calculated: {Calculated}, Provided: {Provided}", calc, providedHash);
                return false;
            }

            // Get response code and amount
            var rspCode = filtered.GetValueOrDefault("vnp_ResponseCode"); // "00" = success
            var rspMessage = filtered.GetValueOrDefault("vnp_ResponseMessage", "");
            
            // Get payment record using actual extracted paymentId
            var payment = await _payments.GetAsync(actualPaymentId, ct);
            if (payment is null)
            {
                _logger.LogWarning("[VNPay VerifyFromReturnUrl] Payment {PaymentId} not found", actualPaymentId);
                return false;
            }
            
            // Verify amount if provided
            if (filtered.TryGetValue("vnp_Amount", out var vnpAmountStr) && long.TryParse(vnpAmountStr, out var vnpAmount))
            {
                var amount = vnpAmount / 100m; // Convert from smallest unit to VND
                if (Math.Abs(payment.Amount - amount) > 0.01m)
                {
                    _logger.LogWarning("[VNPay VerifyFromReturnUrl] Amount mismatch. Payment: {PaymentAmount}, VNPay: {VnpayAmount}", payment.Amount, amount);
                    return false;
                }
            }

            // Save full response
            payment.PaymentResponse = System.Text.Json.JsonSerializer.Serialize(filtered);

            // Process based on response code
            if (rspCode == "00")
            {
                // Idempotency check: if payment is already completed, just return true
                if (payment.Status == PaymentStatus.Completed)
                {
                    _logger.LogInformation("[VNPay VerifyFromReturnUrl] Payment {PaymentId} is already completed, skipping duplicate processing", paymentId);
                    return true;
                }
                
                // Sử dụng transaction để đảm bảo data consistency
                using var transaction = await _context.Database.BeginTransactionAsync(ct);
                try
                {
                    payment.Status = PaymentStatus.Completed;
                    payment.TransactionId = filtered.GetValueOrDefault("vnp_TransactionNo");
                    payment.PaidAt = DateTime.UtcNow;
                    await _payments.UpdateAsync(payment, ct);

                    // Update booking status
                    var booking = await _bookings.GetAsync(payment.BookingId, ct);
                    if (booking != null && booking.Status == BookingStatus.Pending)
                    {
                        booking.Status = BookingStatus.Confirmed;
                        booking.ExpiresAt = null;
                        await _bookings.UpdateAsync(booking, ct);

                        // Create tickets for the confirmed booking
                        await CreateTicketsForBookingAsync(booking.Id, ct);
                    }

                    // Commit transaction
                    await transaction.CommitAsync(ct);

                    // Không cần gửi notification vì user đã được redirect về Order Detail

                    _logger.LogInformation("[VNPay VerifyFromReturnUrl] Payment {PaymentId} completed successfully from return URL", paymentId);
                    return true;
                }
                catch (Exception ex)
                {
                    // Rollback transaction nếu có lỗi
                    await transaction.RollbackAsync(ct);
                    _logger.LogError(ex, "[VNPay VerifyFromReturnUrl] Transaction rollback due to error: {Message}", ex.Message);
                    throw;
                }
            }
            else
            {
                // Handle various failure response codes
                payment.Status = PaymentStatus.Failed;
                await _payments.UpdateAsync(payment, ct);
                
                var errorMessage = GetVNPayErrorMessage(rspCode, rspMessage);
                _logger.LogWarning("[VNPay VerifyFromReturnUrl] Payment {PaymentId} failed. Response code: {ResponseCode}, Message: {ErrorMessage}", 
                    paymentId, rspCode, errorMessage);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[VNPay VerifyFromReturnUrl] Exception occurred: {Message}", ex.Message);
            return false;
        }
    }

    public Task<bool> RefundAsync(int paymentId, decimal amount, string reason, CancellationToken ct)
        => Task.FromResult(false); // tuỳ hợp đồng, để stub

    public async Task<PaymentIntentDto> CreatePaymentAsync(int paymentId, int bookingId, decimal amount, string orderInfo, string clientIp, CancellationToken ct)
    {
        // Read configuration from appsettings.json
        var baseUrl = _cfg["VNPay:BaseUrl"];
        var tmnCode = _cfg["VNPay:TmnCode"];
        var secret = _cfg["VNPay:HashSecret"];
        var returnUrl = _cfg["VNPay:ReturnUrl"] ?? _cfg["Payments:ReturnUrl"]; // Prefer VNPay:ReturnUrl, fallback to Payments:ReturnUrl
        var ipnUrl = _cfg["VNPay:IpnUrl"];
        var locale = _cfg["VNPay:Locale"] ?? "vn";
        var version = _cfg["VNPay:Version"] ?? "2.1.0";
        var orderType = _cfg["VNPay:OrderType"] ?? "other";
        var expireMinutes = _cfg.GetValue<int>("VNPay:ExpireMinutes", 15);
        
        // Validate required configuration
        if (string.IsNullOrWhiteSpace(baseUrl))
            throw new InvalidOperationException("VNPay:BaseUrl is not configured in appsettings.json");
        if (string.IsNullOrWhiteSpace(tmnCode))
            throw new InvalidOperationException("VNPay:TmnCode is not configured in appsettings.json");
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("VNPay:HashSecret is not configured in appsettings.json");
        if (string.IsNullOrWhiteSpace(returnUrl))
            throw new InvalidOperationException("VNPay:ReturnUrl or Payments:ReturnUrl is not configured in appsettings.json");
        if (string.IsNullOrWhiteSpace(ipnUrl))
            _logger.LogWarning("[VNPay] IpnUrl is not configured. Webhook notifications may not work properly.");
        
        // Calculate expiration time
        // VNPay requires expire date to be in format: yyyyMMddHHmmss (GMT+7 timezone)
        // According to VNPay documentation: "Thời gian ghi nhận giao dịch tại website của merchant GMT+7"
        var now = DateTime.Now; // Use local time (GMT+7) as per VNPay spec
        var expire = now.AddMinutes(expireMinutes);
        
        // Validate expire date is in the future
        if (expire <= now)
        {
            throw new InvalidOperationException($"Invalid expiration time. Expire date must be in the future.");
        }
        
        // VNPay typically allows max 15-30 minutes expiration
        // We use configured expireMinutes (default 15)

        // Validate amount
        if (amount <= 0)
            throw new InvalidOperationException($"Invalid payment amount: {amount}. Amount must be greater than 0");
        
        // VNPay minimum amount is typically 1000 VND (0.01 VND in smallest unit = 1)
        // But we allow any positive amount as the actual minimum depends on VNPay configuration
        if (amount < 1)
            throw new InvalidOperationException($"Invalid payment amount: {amount}. Amount must be at least 1 VND");

        // Ensure IP is valid IPv4 (VNPAY doesn't accept IPv6)
        var validIp = clientIp;
        if (string.IsNullOrWhiteSpace(validIp))
        {
            validIp = "127.0.0.1";
        }
        else if (validIp == "::1" || validIp == "0:0:0:0:0:0:0:1")
        {
            // Convert IPv6 localhost to IPv4
            validIp = "127.0.0.1";
        }
        else if (validIp.Contains(":"))
        {
            // IPv6 address - use localhost as fallback
            validIp = "127.0.0.1";
        }
        else if (!System.Net.IPAddress.TryParse(validIp, out _))
        {
            // Invalid IP format - use localhost as fallback
            _logger.LogWarning("[VNPay] Invalid IP format: {Ip}, using 127.0.0.1", validIp);
            validIp = "127.0.0.1";
        }

        // Prepare parameters in alphabetical order (VNPAY requirement)
        // VNPay yêu cầu amount ở đơn vị nhỏ nhất (đồng), nên nhân 100
        // Ví dụ: 100000 VND = 10000000 đồng nhỏ nhất   
        // Dùng Math.Round để tránh mất độ chính xác khi cast
        var vnpAmount = (long)Math.Round(amount * 100);
        
        // Log amount conversion for debugging
        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug("[VNPay] Amount conversion: {Amount} VND -> {VnpAmount} (smallest unit)", amount, vnpAmount);
        }
        
        // Prepare parameters in alphabetical order (VNPay requirement)
        // SortedDictionary ensures alphabetical order automatically
        // IMPORTANT: All values must be trimmed and cleaned to avoid hash mismatch
        var dict = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Amount"] = vnpAmount.ToString().Trim(), // Amount in smallest unit (đồng)
            ["vnp_Command"] = "pay",
            // vnp_CreateDate: Payment creation time in local time GMT+7 (format: yyyyMMddHHmmss)
            ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss"),
            ["vnp_CurrCode"] = "VND",
            ["vnp_IpAddr"] = validIp.Trim(),
            ["vnp_Locale"] = locale.Trim(),
            // VNPay requires vnp_OrderInfo to be max 255 characters
            // Remove or replace special characters that might cause issues
            ["vnp_OrderInfo"] = (orderInfo.Length > 255 ? orderInfo.Substring(0, 255) : orderInfo)
                .Replace("\n", " ").Replace("\r", " ").Replace("\t", " ").Trim(), // Remove newlines, tabs and trim
            ["vnp_OrderType"] = orderType.Trim(),
            ["vnp_ReturnUrl"] = returnUrl.Trim(),
            ["vnp_TmnCode"] = tmnCode.Trim(),
            // vnp_TxnRef must be unique and max 50 characters
            // Using paymentId with timestamp ensures uniqueness
            ["vnp_TxnRef"] = $"{paymentId}_{now:yyyyMMddHHmmss}".Trim(),  // Must be unique
            ["vnp_Version"] = version.Trim()
        };

        // IMPORTANT: Only add vnp_IpnUrl if configured (not vnp_NotifyUrl)
        // IPN URL allows VNPay to notify backend automatically when payment status changes
        if (!string.IsNullOrWhiteSpace(ipnUrl))
        {
            dict["vnp_IpnUrl"] = ipnUrl.Trim();
        }
        
        // Note: vnp_ExpireDate removed - VNPay sandbox may have issues with this parameter
        // The payment will use default expiration time from VNPay settings

        // Build query string for hash calculation
        // According to VNPay documentation and examples (http://ceb.net.vn/csharp/vnpayment.html):
        // Hash is calculated from URL-encoded query string
        // Format: key1=UrlEncode(value1)&key2=UrlEncode(value2)
        // Parameters must be in alphabetical order (already sorted by SortedDictionary)
        // VNPay default hash algorithm is HMACSHA512 (as per documentation: "Phiên bản hiện tại, mặc định hỗ trợ HMACSHA512")
        var queryString = string.Join("&", dict.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
        
        // Calculate HMAC SHA512 hash from URL-encoded query string
        // VNPay uses HMAC SHA512 as default hash algorithm (can also use SHA256)
        var secureHash = HmacSHA512(secret, queryString);
        
        // Build final redirect URL
        // Format: BaseUrl?queryString&vnp_SecureHash=hash
        // Note: vnp_SecureHashType is optional in VNPay 2.1.0, we don't include it
        // The hash itself should NOT be URL-encoded in the URL
        var redirect = $"{baseUrl}?{queryString}&vnp_SecureHash={secureHash}";
        
        // Always log payment creation for troubleshooting
        _logger.LogInformation("[VNPay] Creating payment - PaymentId: {PaymentId}, Amount: {Amount} VND ({VnpAmount}), TmnCode: {TmnCode}", 
            paymentId, amount, vnpAmount, tmnCode);
        _logger.LogInformation("[VNPay] Parameters - TxnRef: {TxnRef}, CreateDate: {CreateDate}, IP: {IP}", 
            dict["vnp_TxnRef"], dict["vnp_CreateDate"], validIp);
        
        // IMPORTANT: Always log full URL in development for debugging VNPay issues
        _logger.LogWarning("[VNPay] FULL REDIRECT URL (copy this to browser to test manually):");
        _logger.LogWarning("[VNPay] {RedirectUrl}", redirect);
        _logger.LogWarning("[VNPay] Query String for hash: {QueryString}", queryString);
        _logger.LogWarning("[VNPay] Calculated Hash: {Hash}", secureHash);


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

    /// <summary>
    /// Handle VNPay IPN (Instant Payment Notification) webhook
    /// VNPay calls this URL automatically when payment status changes
    /// According to VNPay documentation, IPN can be GET or POST
    /// </summary>
    public async Task<bool> HandleWebhookAsync(HttpRequest request, CancellationToken ct)
    {
        try
        {
            // VNPay IPN can be sent as GET (query parameters) or POST (form data)
            Dictionary<string, string> qp;
            
            if (request.Method == "GET")
            {
                // GET request: parameters are in query string
                qp = request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
            }
            else if (request.Method == "POST")
            {
                // POST request: try form data first, then query string
                if (request.HasFormContentType)
                {
                    var form = await request.ReadFormAsync(ct);
                    qp = form.ToDictionary(k => k.Key, v => v.Value.ToString());
                }
                else
                {
                    // Fallback to query string for POST
                    qp = request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
                }
            }
            else
            {
                _logger.LogWarning("[VNPay Webhook] Unsupported HTTP method: {Method}", request.Method);
                return false;
            }
            
            if (!qp.Any())
            {
                _logger.LogWarning("[VNPay Webhook] No parameters received");
                return false;
            }

            // Verify SecureHash is present (required for security)
            if (!qp.TryGetValue("vnp_SecureHash", out var providedHash) || string.IsNullOrWhiteSpace(providedHash))
            {
                _logger.LogWarning("[VNPay Webhook] Missing vnp_SecureHash parameter");
                return false;
            }

            // Filter out hash-related parameters for hash calculation
            // vnp_SecureHash and vnp_SecureHashType should not be included in hash calculation
            var filtered = new SortedDictionary<string, string>(
                qp.Where(kv => !kv.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                               !kv.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
                  .ToDictionary(k => k.Key, v => v.Value), StringComparer.Ordinal);

            // Build query string for hash verification (same format as payment creation)
            // According to VNPay documentation: hash is calculated from URL-encoded query string
            // When receiving from webhook, values are already URL-decoded by ASP.NET
            // So we need to URL-encode them again to match the original hash calculation
            var data = string.Join("&", filtered.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
            
            // Get hash algorithm type (default to SHA512 as per VNPay documentation)
            var hashType = qp.GetValueOrDefault("vnp_SecureHashType", "SHA512");
            var secret = _cfg["VNPay:HashSecret"];
            if (string.IsNullOrWhiteSpace(secret))
            {
                _logger.LogError("[VNPay Webhook] HashSecret is not configured");
                return false;
            }
            
            // Calculate hash using the specified algorithm
            string calculatedHash;
            if (hashType.Equals("SHA512", StringComparison.OrdinalIgnoreCase))
            {
                calculatedHash = HmacSHA512(secret, data);
            }
            else if (hashType.Equals("SHA256", StringComparison.OrdinalIgnoreCase))
            {
                calculatedHash = HmacSHA256(secret, data);
            }
            else
            {
                _logger.LogWarning("[VNPay Webhook] Unsupported hash type: {HashType}, defaulting to SHA512", hashType);
                calculatedHash = HmacSHA512(secret, data);
            }
            
            // Verify hash (case-insensitive comparison as per VNPay spec)
            if (!string.Equals(calculatedHash, providedHash, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("[VNPay Webhook] Hash verification failed. Calculated: {Calculated}, Provided: {Provided}", 
                    calculatedHash, providedHash);
                return false;
            }
            
            _logger.LogInformation("[VNPay Webhook] Hash verification successful");

            // Parse payment ID from vnp_TxnRef (format: "paymentId_timestamp")
            var txnRef = filtered.GetValueOrDefault("vnp_TxnRef");
            if (string.IsNullOrWhiteSpace(txnRef))
            {
                _logger.LogWarning("[VNPay Webhook] Missing vnp_TxnRef");
                return false;
            }
            
            int paymentId;
            // Handle both old format (just paymentId) and new format (paymentId_timestamp)
            if (txnRef.Contains("_"))
            {
                var parts = txnRef.Split('_');
                if (parts.Length == 0 || !int.TryParse(parts[0], out paymentId) || paymentId <= 0)
                {
                    _logger.LogWarning("[VNPay Webhook] Invalid vnp_TxnRef format: {TxnRef}", txnRef);
                    return false;
                }
            }
            else
            {
                if (!int.TryParse(txnRef, out paymentId) || paymentId <= 0)
                {
                    _logger.LogWarning("[VNPay Webhook] Invalid vnp_TxnRef: {TxnRef}", txnRef);
                    return false;
                }
            }

            // Get response code and message
            var rspCode = filtered.GetValueOrDefault("vnp_ResponseCode"); // "00" = success
            var rspMessage = filtered.GetValueOrDefault("vnp_ResponseMessage", "");
            var transactionNo = filtered.GetValueOrDefault("vnp_TransactionNo"); // VNPay transaction number
            
            // Parse and validate amount
            var vnpAmountStr = filtered.GetValueOrDefault("vnp_Amount");
            if (string.IsNullOrWhiteSpace(vnpAmountStr) || !long.TryParse(vnpAmountStr, out var vnpAmount) || vnpAmount <= 0)
            {
                _logger.LogWarning("[VNPay Webhook] Invalid or missing vnp_Amount: {Amount}", vnpAmountStr);
                return false;
            }
            
            // Convert from smallest unit (đồng) to VND
            // Example: 10000000 (đồng) = 100000 (VND)
            var amount = vnpAmount / 100m;

            // Get payment record
            var payment = await _payments.GetAsync(paymentId, ct);
            if (payment is null)
            {
                _logger.LogWarning("[VNPay Webhook] Payment {PaymentId} not found", paymentId);
                return false;
            }

            // Verify amount matches (allow small rounding differences)
            if (Math.Abs(payment.Amount - amount) > 0.01m)
            {
                _logger.LogWarning("[VNPay Webhook] Amount mismatch. Payment: {PaymentAmount}, VNPay: {VnpayAmount}", payment.Amount, amount);
                return false;
            }

            // Save full response
            payment.PaymentResponse = System.Text.Json.JsonSerializer.Serialize(filtered);

            // Process based on response code
            // VNPay response codes: "00" = success, others = various failure reasons
            if (rspCode == "00")
            {
                // Idempotency check: if payment is already completed, just return true
                if (payment.Status == PaymentStatus.Completed)
                {
                    _logger.LogInformation($"[VNPay Webhook] Payment {paymentId} is already completed, skipping duplicate processing");
                    _logger.LogInformation("[VNPay Webhook] Payment {PaymentId} is already completed, skipping duplicate processing", paymentId);
                    return true;
                }
                
                // Sử dụng transaction để đảm bảo data consistency
                using var transaction = await _context.Database.BeginTransactionAsync(ct);
                try
                {
                    payment.Status = PaymentStatus.Completed;
                    payment.TransactionId = filtered.GetValueOrDefault("vnp_TransactionNo");
                    payment.PaidAt = DateTime.UtcNow;
                    await _payments.UpdateAsync(payment, ct);

                    // Update booking status
                    var booking = await _bookings.GetAsync(payment.BookingId, ct);
                    if (booking != null && booking.Status == BookingStatus.Pending)
                    {
                        booking.Status = BookingStatus.Confirmed;
                        booking.ExpiresAt = null;
                        await _bookings.UpdateAsync(booking, ct);

                        // Create tickets for the confirmed booking
                        await CreateTicketsForBookingAsync(booking.Id, ct);
                    }

                    // Commit transaction
                    await transaction.CommitAsync(ct);

                    _logger.LogInformation("[VNPay Webhook] Payment {PaymentId} and booking {BookingId} processed successfully", 
                        paymentId, booking?.Id);
                    return true;
                }
                catch (Exception ex)
                {
                    // Rollback transaction nếu có lỗi
                    await transaction.RollbackAsync(ct);
                    _logger.LogError(ex, "[VNPay Webhook] Transaction rollback due to error: {Message}", ex.Message);
                    throw;
                }
            }
            else
            {
                // Handle various failure response codes
                payment.Status = PaymentStatus.Failed;
                await _payments.UpdateAsync(payment, ct);
                
                var errorMessage = GetVNPayErrorMessage(rspCode, rspMessage);
                _logger.LogWarning($"[VNPay Webhook] Payment {paymentId} failed. Response code: {rspCode}, Message: {errorMessage}");
                _logger.LogWarning("[VNPay Webhook] Payment {PaymentId} failed. Response code: {ResponseCode}, Message: {ErrorMessage}", 
                    paymentId, rspCode, errorMessage);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[VNPay Webhook] Exception occurred while processing webhook: {Message}", ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Calculate HMAC SHA256 hash for VNPay
    /// VNPay requires uppercase hexadecimal format
    /// </summary>
    private static string HmacSHA256(string key, string data)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Hash secret key cannot be null or empty", nameof(key));
        if (string.IsNullOrWhiteSpace(data))
            throw new ArgumentException("Data to hash cannot be null or empty", nameof(data));
            
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        
        // VNPay requires uppercase hexadecimal format without dashes
        return BitConverter.ToString(hashBytes).Replace("-", string.Empty).ToUpperInvariant();
    }
    
    /// <summary>
    /// Calculate HMAC SHA512 hash for VNPay (backward compatibility)
    /// Some older VNPay integrations may use SHA512
    /// </summary>
    private static string HmacSHA512(string key, string data)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Hash secret key cannot be null or empty", nameof(key));
        if (string.IsNullOrWhiteSpace(data))
            throw new ArgumentException("Data to hash cannot be null or empty", nameof(data));
            
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        
        // VNPay requires uppercase hexadecimal format without dashes
        return BitConverter.ToString(hashBytes).Replace("-", string.Empty).ToUpperInvariant();
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
            _logger.LogWarning("[VNPay] Booking {BookingId} not found for ticket creation", bookingId);
            return;
        }

        // Check if tickets already exist
        if (booking.Tickets != null && booking.Tickets.Any())
        {
            _logger.LogInformation("[VNPay] Tickets already exist for booking {BookingId}, skipping creation", bookingId);
            return;
        }

        // Get all ticket types for this event
        var ticketTypes = await _context.TicketTypes
            .Where(tt => tt.EventId == booking.EventId && tt.IsActive)
            .ToListAsync(ct);

        if (!ticketTypes.Any())
        {
            _logger.LogWarning("[VNPay] No ticket types found for event {EventId}", booking.EventId);
            return;
        }

        // Find the ticket type that matches the booking amount
        // Calculate quantity: TotalAmount / Price (considering discount)
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

        // Create tickets based on seat selection or general booking
        var ticketsToCreate = new List<Ticket>();
        
        // Check if this is a seat-based booking
        if (!string.IsNullOrEmpty(booking.SeatIdsJson))
        {
            try
            {
                var seatIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(booking.SeatIdsJson);
                if (seatIds != null && seatIds.Any())
                {
                    // Get seat details for ticket creation
                    var seats = await _context.Seats
                        .Include(s => s.TicketType)
                        .Include(s => s.SeatZone)
                        .Where(s => seatIds.Contains(s.Id))
                        .ToListAsync(ct);

                    int ticketIndex = 1;
                    var eventId = seats.FirstOrDefault()?.TicketType.EventId;
                    
                    foreach (var seat in seats)
                    {
                        var ticket = new Ticket
                        {
                            BookingId = bookingId,
                            TicketTypeId = seat.TicketTypeId,
                            SeatId = seat.Id,
                            TicketCode = GenerateTicketCode(bookingId, ticketIndex++),
                            Price = seat.SeatZone?.ZonePrice ?? seat.TicketType.Price,
                            Status = TicketStatus.Valid,
                            CreatedAt = DateTime.UtcNow
                        };
                        ticketsToCreate.Add(ticket);

                        // Mark seat as sold
                        seat.Status = SeatStatus.Sold;
                        seat.ReservedByUserId = null;
                        seat.ReservedUntil = null;
                    }

                    // Broadcast seat sold status
                    if (eventId.HasValue)
                    {
                        await _seatHubContext.Clients
                            .Group($"Event_{eventId}")
                            .SendAsync("SeatsUpdated", new
                            {
                                eventId = eventId.Value,
                                seatIds = seatIds,
                                status = "Sold"
                            }, ct);
                    }

                    _logger.LogInformation("[VNPay] Created {Count} seat-based tickets for booking {BookingId}", ticketsToCreate.Count, bookingId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[VNPay] Error parsing seat IDs: {Message}", ex.Message);
            }
        }
        
        // Fallback: create general tickets if no seats or error
        if (!ticketsToCreate.Any())
        {
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
            _logger.LogInformation("[VNPay] Created {Count} general tickets for booking {BookingId}", ticketsToCreate.Count, bookingId);
        }

        // Bulk create tickets
        await _tickets.CreateBulkAsync(ticketsToCreate);
        await _context.SaveChangesAsync(); // Save seat status changes
    }

    private static string GenerateTicketCode(int bookingId, int ticketNumber)
    {
        return $"TK{bookingId:D6}{ticketNumber:D3}{DateTime.UtcNow:yyyyMMdd}";
    }

    private static string GetVNPayErrorMessage(string? responseCode, string? responseMessage)
    {
        if (string.IsNullOrWhiteSpace(responseCode))
            return "Unknown error";

        return responseCode switch
        {
            "00" => "Giao dịch thành công",
            "07" => "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
            "09" => "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
            "10" => "Xác thực thông tin thẻ/tài khoản không đúng. Quá 3 lần",
            "11" => "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.",
            "12" => "Thẻ/Tài khoản bị khóa.",
            "13" => "Nhập sai mật khẩu xác thực giao dịch (OTP). Quá 3 lần",
            "51" => "Tài khoản không đủ số dư để thực hiện giao dịch.",
            "65" => "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
            "75" => "Ngân hàng thanh toán đang bảo trì.",
            "79" => "Nhập sai mật khẩu thanh toán quá số lần quy định.",
            "99" => "Lỗi không xác định.",
            _ => string.IsNullOrWhiteSpace(responseMessage) 
                ? $"Lỗi không xác định (Mã: {responseCode})" 
                : $"{responseMessage} (Mã: {responseCode})"
        };
    }
}
