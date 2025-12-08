using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Payment;
using Tickify.Hubs;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Services.Payments;

/// <summary>
/// Credit Card Payment Provider - Direct card processing (mock implementation)
/// In production, this would integrate with Stripe, Square, or other card processors
/// </summary>
public sealed class CreditCardProvider : IPaymentProvider
{
    public string Name => "creditcard";
    
    private readonly IConfiguration _cfg;
    private readonly IPaymentRepository _payments;
    private readonly IBookingRepository _bookings;
    private readonly ITicketRepository _tickets;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CreditCardProvider> _logger;
    private readonly IHubContext<SeatHub> _seatHubContext;

    public CreditCardProvider(
        IConfiguration cfg,
        IPaymentRepository payments,
        IBookingRepository bookings,
        ITicketRepository tickets,
        ApplicationDbContext context,
        ILogger<CreditCardProvider> logger,
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

    public async Task<PaymentIntentDto> CreatePaymentAsync(
        int paymentId, 
        int bookingId, 
        decimal amount, 
        string orderInfo, 
        string clientIp, 
        CancellationToken ct)
    {
        _logger.LogInformation("[CreditCard] Creating payment - PaymentId: {PaymentId}, Amount: {Amount} VND", 
            paymentId, amount);

        // Get return URL from configuration
        var returnUrl = _cfg["Payments:ReturnUrl"] ?? "http://localhost:3000/payment/return";
        
        // In a real implementation, this would:
        // 1. Tokenize card details (PCI-DSS compliant)
        // 2. Submit to payment processor (Stripe, Square, etc.)
        // 3. Handle 3D Secure authentication
        // 4. Return redirect URL or confirmation
        
        // For mock implementation, create a redirect to our own success page
        var redirectUrl = $"{returnUrl}?paymentId={paymentId}&status=success&provider=creditcard";
        
        // Update payment with gateway info
        var payment = await _payments.GetAsync(paymentId, ct);
        if (payment != null)
        {
            payment.PaymentGateway = Name;
            payment.PaymentResponse = $"{{\"redirect\":\"{redirectUrl}\",\"mock\":true}}";
            await _payments.UpdateAsync(payment, ct);
        }

        _logger.LogInformation("[CreditCard] Payment intent created - Redirect: {RedirectUrl}", redirectUrl);

        return new PaymentIntentDto
        {
            Provider = Name,
            PaymentId = paymentId,
            RedirectUrl = redirectUrl,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15)
        };
    }

    public async Task<bool> VerifyAsync(int paymentId, CancellationToken ct)
    {
        var payment = await _payments.GetAsync(paymentId, ct);
        if (payment == null) return false;

        var booking = await _bookings.GetByIdAsync(payment.BookingId);
        if (booking == null) return false;

        // If payment is completed, confirm booking
        if (payment.Status == PaymentStatus.Completed)
        {
            if (booking.Status == BookingStatus.Pending)
            {
                booking.Status = BookingStatus.Confirmed;
                booking.ExpiresAt = null;
                await _bookings.UpdateAsync(booking);
            }
            
            await CreateTicketsForBookingAsync(booking.Id, ct);
            return true;
        }

        // If booking is confirmed, update payment
        if (booking.Status == BookingStatus.Confirmed)
        {
            if (payment.Status == PaymentStatus.Pending)
            {
                payment.Status = PaymentStatus.Completed;
                payment.PaidAt = DateTime.UtcNow;
                await _payments.UpdateAsync(payment, ct);
            }
            
            await CreateTicketsForBookingAsync(booking.Id, ct);
            return true;
        }

        return false;
    }

    public async Task<bool> VerifyFromReturnUrlAsync(int paymentId, IQueryCollection queryParams, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("[CreditCard] Verifying payment {PaymentId} from return URL", paymentId);

            var status = queryParams["status"].ToString();
            var provider = queryParams["provider"].ToString();

            // Validate this is our provider
            if (!provider.Equals("creditcard", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("[CreditCard] Invalid provider in return URL: {Provider}", provider);
                return false;
            }

            // Get payment record
            var payment = await _payments.GetAsync(paymentId, ct);
            if (payment == null)
            {
                _logger.LogWarning("[CreditCard] Payment {PaymentId} not found", paymentId);
                return false;
            }

            // In mock mode, always succeed
            if (status.Equals("success", StringComparison.OrdinalIgnoreCase))
            {
                // Check idempotency
                if (payment.Status == PaymentStatus.Completed)
                {
                    _logger.LogInformation("[CreditCard] Payment {PaymentId} already completed", paymentId);
                    return true;
                }

                using var transaction = await _context.Database.BeginTransactionAsync(ct);
                try
                {
                    // Complete payment
                    payment.Status = PaymentStatus.Completed;
                    payment.TransactionId = $"CC_{paymentId}_{DateTime.UtcNow:yyyyMMddHHmmss}";
                    payment.PaidAt = DateTime.UtcNow;
                    await _payments.UpdateAsync(payment, ct);

                    // Confirm booking
                    var booking = await _bookings.GetByIdAsync(payment.BookingId);
                    if (booking != null && booking.Status == BookingStatus.Pending)
                    {
                        booking.Status = BookingStatus.Confirmed;
                        booking.ExpiresAt = null;
                        await _bookings.UpdateAsync(booking);

                        await CreateTicketsForBookingAsync(booking.Id, ct);
                    }

                    await transaction.CommitAsync(ct);

                    _logger.LogInformation("[CreditCard] Payment {PaymentId} completed successfully", paymentId);
                    return true;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync(ct);
                    _logger.LogError(ex, "[CreditCard] Transaction rollback: {Message}", ex.Message);
                    throw;
                }
            }
            else
            {
                payment.Status = PaymentStatus.Failed;
                await _payments.UpdateAsync(payment, ct);
                _logger.LogWarning("[CreditCard] Payment {PaymentId} failed", paymentId);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CreditCard] Verification error: {Message}", ex.Message);
            return false;
        }
    }

    public Task<bool> HandleWebhookAsync(HttpRequest request, CancellationToken ct)
    {
        // Credit card provider doesn't use webhooks in mock implementation
        _logger.LogWarning("[CreditCard] Webhook received but not implemented");
        return Task.FromResult(false);
    }

    public Task<bool> RefundAsync(int paymentId, decimal amount, string reason, CancellationToken ct)
    {
        // Stub for refund functionality
        return Task.FromResult(false);
    }

    private async Task CreateTicketsForBookingAsync(int bookingId, CancellationToken ct)
    {
        var booking = await _context.Bookings
            .Include(b => b.Event)
            .Include(b => b.Tickets)
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        if (booking == null)
        {
            _logger.LogWarning("[CreditCard] Booking {BookingId} not found", bookingId);
            return;
        }

        if (booking.Tickets != null && booking.Tickets.Any())
        {
            _logger.LogInformation("[CreditCard] Tickets already exist for booking {BookingId}", bookingId);
            return;
        }

        var ticketTypes = await _context.TicketTypes
            .Where(tt => tt.EventId == booking.EventId && tt.IsActive)
            .ToListAsync(ct);

        if (!ticketTypes.Any())
        {
            _logger.LogWarning("[CreditCard] No ticket types found for event {EventId}", booking.EventId);
            return;
        }

        var pricePerTicket = booking.TotalAmount + booking.DiscountAmount;
        TicketType? selectedTicketType = null;
        int quantity = 1;

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

        if (selectedTicketType == null)
        {
            selectedTicketType = ticketTypes.OrderByDescending(tt => tt.Price).First();
            quantity = (int)Math.Ceiling(pricePerTicket / selectedTicketType.Price);
            if (quantity <= 0) quantity = 1;
        }

        var ticketsToCreate = new List<Ticket>();

        // Handle seat-based booking
        if (!string.IsNullOrEmpty(booking.SeatIdsJson))
        {
            try
            {
                var seatIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(booking.SeatIdsJson);
                if (seatIds != null && seatIds.Any())
                {
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

                        seat.Status = SeatStatus.Sold;
                        seat.ReservedByUserId = null;
                        seat.ReservedUntil = null;
                    }

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

                    _logger.LogInformation("[CreditCard] Created {Count} seat tickets for booking {BookingId}", 
                        ticketsToCreate.Count, bookingId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[CreditCard] Error parsing seat IDs: {Message}", ex.Message);
            }
        }

        // Fallback: create general tickets
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
            _logger.LogInformation("[CreditCard] Created {Count} general tickets for booking {BookingId}", 
                ticketsToCreate.Count, bookingId);
        }

        await _tickets.CreateBulkAsync(ticketsToCreate);
        await _context.SaveChangesAsync(ct);
    }

    private static string GenerateTicketCode(int bookingId, int ticketNumber)
    {
        return $"TK{bookingId:D6}{ticketNumber:D3}{DateTime.UtcNow:yyyyMMdd}";
    }
}
