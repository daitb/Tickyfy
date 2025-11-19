// Services/Payments/VNPayProvider.cs
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Tickify.Data;
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
    private readonly ITicketRepository _tickets;
    private readonly ApplicationDbContext _context;

    public VNPayProvider(
        IConfiguration cfg, 
        IPaymentRepository payments, 
        IBookingRepository bookings,
        ITicketRepository tickets,
        ApplicationDbContext context)
    { 
        _cfg = cfg; 
        _payments = payments; 
        _bookings = bookings;
        _tickets = tickets;
        _context = context;
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
                Console.WriteLine($"[VNPay Verify] Confirmed booking {booking.Id} for completed payment {paymentId}");
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
                Console.WriteLine($"[VNPay Verify] Updated payment {paymentId} to Completed for confirmed booking {booking.Id}");
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
            
            if (!qp.TryGetValue("vnp_SecureHash", out var providedHash) || string.IsNullOrWhiteSpace(providedHash))
            {
                Console.WriteLine("[VNPay VerifyFromReturnUrl] Missing vnp_SecureHash");
                return false;
            }

            // Filter out hash parameters for hash calculation
            var filtered = new SortedDictionary<string, string>(
                qp.Where(kv => !kv.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                               !kv.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
                  .ToDictionary(k => k.Key, v => v.Value), StringComparer.Ordinal);

            // Build query string for hash verification
            var data = string.Join("&", filtered.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
            
            // Get hash type (default to SHA256)
            var hashType = qp.GetValueOrDefault("vnp_SecureHashType", "SHA256");
            string calc;
            if (hashType.Equals("SHA256", StringComparison.OrdinalIgnoreCase))
            {
                calc = HmacSHA256(_cfg["VNPay:HashSecret"]!, data);
            }
            else
            {
                calc = HmacSHA512(_cfg["VNPay:HashSecret"]!, data);
            }
            
            // Verify hash
            if (!string.Equals(calc, providedHash, StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"[VNPay VerifyFromReturnUrl] Hash mismatch. Calculated: {calc}, Provided: {providedHash}");
                return false;
            }

            // Get response code
            var rspCode = filtered.GetValueOrDefault("vnp_ResponseCode"); // "00" = success
            
            // Get payment record
            var payment = await _payments.GetAsync(paymentId, ct);
            if (payment is null)
            {
                Console.WriteLine($"[VNPay VerifyFromReturnUrl] Payment {paymentId} not found");
                return false;
            }

            // Save full response
            payment.PaymentResponse = System.Text.Json.JsonSerializer.Serialize(filtered);

            // Process based on response code
            if (rspCode == "00")
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

                Console.WriteLine($"[VNPay VerifyFromReturnUrl] Payment {paymentId} completed successfully from return URL");
                return true;
            }
            else
            {
                payment.Status = PaymentStatus.Failed;
                await _payments.UpdateAsync(payment, ct);
                Console.WriteLine($"[VNPay VerifyFromReturnUrl] Payment {paymentId} failed. Response code: {rspCode}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VNPay VerifyFromReturnUrl] Exception: {ex.Message}");
            Console.WriteLine($"[VNPay VerifyFromReturnUrl] StackTrace: {ex.StackTrace}");
            return false;
        }
    }

    public Task<bool> RefundAsync(int paymentId, decimal amount, string reason, CancellationToken ct)
        => Task.FromResult(false); // tuỳ hợp đồng, để stub

    public async Task<PaymentIntentDto> CreatePaymentAsync(int paymentId, int bookingId, decimal amount, string orderInfo, string clientIp, CancellationToken ct)
    {
        var baseUrl = _cfg["VNPay:BaseUrl"];
        var tmnCode = _cfg["VNPay:TmnCode"];
        var secret = _cfg["VNPay:HashSecret"];
        var returnUrl = _cfg["Payments:ReturnUrl"];
        var ipnUrl = _cfg["VNPay:IpnUrl"];
        
        if (string.IsNullOrWhiteSpace(baseUrl))
            throw new InvalidOperationException("VNPay:BaseUrl is not configured");
        if (string.IsNullOrWhiteSpace(tmnCode))
            throw new InvalidOperationException("VNPay:TmnCode is not configured");
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("VNPay:HashSecret is not configured");
        if (string.IsNullOrWhiteSpace(returnUrl))
            throw new InvalidOperationException("Payments:ReturnUrl is not configured");
        if (string.IsNullOrWhiteSpace(ipnUrl))
            throw new InvalidOperationException("VNPay:IpnUrl is not configured");
        
        var expire = DateTime.UtcNow.AddMinutes(int.Parse(_cfg["VNPay:ExpireMinutes"] ?? "15"));

        // Validate amount
        if (amount <= 0)
            throw new InvalidOperationException($"Invalid payment amount: {amount}. Amount must be greater than 0");

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
            Console.WriteLine($"[VNPay] Invalid IP format: {validIp}, using 127.0.0.1");
            validIp = "127.0.0.1";
        }

        // Prepare parameters in alphabetical order (VNPAY requirement)
        var dict = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Amount"] = ((long)(amount * 100)).ToString(), // Convert to VND (smallest unit)
            ["vnp_Command"] = "pay",
            ["vnp_CreateDate"] = DateTime.UtcNow.ToString("yyyyMMddHHmmss"),
            ["vnp_CurrCode"] = "VND",
            ["vnp_ExpireDate"] = expire.ToString("yyyyMMddHHmmss"),
            ["vnp_IpAddr"] = validIp,
            ["vnp_Locale"] = _cfg["VNPay:Locale"] ?? "vn",
            ["vnp_OrderInfo"] = orderInfo.Length > 255 ? orderInfo.Substring(0, 255) : orderInfo, // VNPAY max 255 chars
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = returnUrl,
            ["vnp_TmnCode"] = tmnCode,
            ["vnp_TxnRef"] = paymentId.ToString(),  // Must be unique
            ["vnp_Version"] = "2.1.0"
        };

        // Add NotifyUrl if provided (optional but recommended)
        if (!string.IsNullOrWhiteSpace(ipnUrl))
        {
            dict["vnp_NotifyUrl"] = ipnUrl;
        }

        // Build query string for hash calculation (URL-encoded values)
        var queryString = string.Join("&", dict.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
        
        // Calculate hash using SHA256
        var secureHash = HmacSHA256(secret, queryString);
        
        // Log for debugging
        Console.WriteLine($"[VNPay] Creating payment - PaymentId: {paymentId}, Amount: {amount}, TmnCode: {tmnCode}");
        Console.WriteLine($"[VNPay] Client IP: {clientIp} -> Valid IP: {validIp}");
        Console.WriteLine($"[VNPay] Query string (for hash): {queryString}");
        Console.WriteLine($"[VNPay] SecureHash (SHA256): {secureHash}");
        
        // Build final redirect URL
        // Note: Some VNPAY versions don't require vnp_SecureHashType parameter
        // Try without it first, if it doesn't work, add it back
        var redirect = $"{baseUrl}?{queryString}&vnp_SecureHash={secureHash}";


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
        try
        {
            // Get all query parameters
            var qp = request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
            
            // VNPAY webhook can be GET or POST, check both
            if (!qp.Any() && request.Method == "POST")
            {
                // Try to read from form data
                if (request.HasFormContentType)
                {
                    var form = await request.ReadFormAsync(ct);
                    qp = form.ToDictionary(k => k.Key, v => v.Value.ToString());
                }
            }

            if (!qp.TryGetValue("vnp_SecureHash", out var providedHash) || string.IsNullOrWhiteSpace(providedHash))
            {
                Console.WriteLine("[VNPay Webhook] Missing vnp_SecureHash");
                return false;
            }

            // Filter out hash parameters for hash calculation
            var filtered = new SortedDictionary<string, string>(
                qp.Where(kv => !kv.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase) &&
                               !kv.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
                  .ToDictionary(k => k.Key, v => v.Value), StringComparer.Ordinal);

            // Build query string for hash verification (same format as creation)
            var data = string.Join("&", filtered.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
            
            // Get hash type (default to SHA256)
            var hashType = qp.GetValueOrDefault("vnp_SecureHashType", "SHA256");
            string calc;
            if (hashType.Equals("SHA256", StringComparison.OrdinalIgnoreCase))
            {
                calc = HmacSHA256(_cfg["VNPay:HashSecret"]!, data);
            }
            else
            {
                calc = HmacSHA512(_cfg["VNPay:HashSecret"]!, data);
            }
            
            // Verify hash (case-insensitive comparison)
            if (!string.Equals(calc, providedHash, StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"[VNPay Webhook] Hash mismatch. Calculated: {calc}, Provided: {providedHash}");
                return false;
            }

            // Parse payment ID
            if (!int.TryParse(filtered.GetValueOrDefault("vnp_TxnRef"), out var paymentId))
            {
                Console.WriteLine($"[VNPay Webhook] Invalid vnp_TxnRef: {filtered.GetValueOrDefault("vnp_TxnRef")}");
                return false;
            }

            // Get response code and amount
            var rspCode = filtered.GetValueOrDefault("vnp_ResponseCode"); // "00" = success
            if (!decimal.TryParse(filtered.GetValueOrDefault("vnp_Amount"), out var vnpAmount))
            {
                Console.WriteLine($"[VNPay Webhook] Invalid vnp_Amount: {filtered.GetValueOrDefault("vnp_Amount")}");
                return false;
            }
            var amount = vnpAmount / 100m; // Convert from smallest unit to VND

            // Get payment record
            var payment = await _payments.GetAsync(paymentId, ct);
            if (payment is null)
            {
                Console.WriteLine($"[VNPay Webhook] Payment {paymentId} not found");
                return false;
            }

            // Verify amount matches
            if (Math.Abs(payment.Amount - amount) > 0.01m) // Allow small rounding differences
            {
                Console.WriteLine($"[VNPay Webhook] Amount mismatch. Payment: {payment.Amount}, VNPay: {amount}");
                return false;
            }

            // Save full response
            payment.PaymentResponse = System.Text.Json.JsonSerializer.Serialize(filtered);

            // Process based on response code
            if (rspCode == "00")
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

                Console.WriteLine($"[VNPay Webhook] Payment {paymentId} completed successfully");
                return true;
            }
            else
            {
                payment.Status = PaymentStatus.Failed;
                await _payments.UpdateAsync(payment, ct);
                Console.WriteLine($"[VNPay Webhook] Payment {paymentId} failed. Response code: {rspCode}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VNPay Webhook] Exception: {ex.Message}");
            Console.WriteLine($"[VNPay Webhook] StackTrace: {ex.StackTrace}");
            return false;
        }
    }

    private static string HmacSHA256(string key, string data)
    {
        using var h = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hashBytes = h.ComputeHash(Encoding.UTF8.GetBytes(data));
        // VNPAY requires uppercase hex format
        return BitConverter.ToString(hashBytes).Replace("-", string.Empty).ToUpperInvariant();
    }
    
    // Keep SHA512 for backward compatibility (used in webhook verification)
    private static string HmacSHA512(string key, string data)
    {
        using var h = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hashBytes = h.ComputeHash(Encoding.UTF8.GetBytes(data));
        // VNPAY requires uppercase hex format
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
            Console.WriteLine($"[VNPay] Booking {bookingId} not found for ticket creation");
            return;
        }

        // Check if tickets already exist
        if (booking.Tickets != null && booking.Tickets.Any())
        {
            Console.WriteLine($"[VNPay] Tickets already exist for booking {bookingId}");
            return;
        }

        // Get all ticket types for this event
        var ticketTypes = await _context.TicketTypes
            .Where(tt => tt.EventId == booking.EventId && tt.IsActive)
            .ToListAsync(ct);

        if (!ticketTypes.Any())
        {
            Console.WriteLine($"[VNPay] No ticket types found for event {booking.EventId}");
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
        Console.WriteLine($"[VNPay] Created {ticketsToCreate.Count} tickets for booking {bookingId}");
    }

    private static string GenerateTicketCode(int bookingId, int ticketNumber)
    {
        return $"TK{bookingId:D6}{ticketNumber:D3}{DateTime.UtcNow:yyyyMMdd}";
    }
}
