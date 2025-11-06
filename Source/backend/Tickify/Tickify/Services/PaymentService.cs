using Microsoft.EntityFrameworkCore;
using Stripe;
using PayOS;
using PayOS.Models;
using Tickify.DTOs.Payment;
using Tickify.Models;
using Tickify.Data;
using Tickify.Services.Email;
using Net.payOS.Types;

namespace Tickify.Services
{
    public interface IPaymentService
    {
        Task<PaymentIntentDto> CreatePaymentIntentAsync(CreatePaymentDto request);
        Task ProcessStripeWebhook(string json, string signature);
        Task ProcessPayOSWebhook(PaymentCallbackDto callback);
        Task<PaymentDetailDto> GetPaymentAsync(Guid id);
        Task<List<PaymentDetailDto>> GetPaymentsByBookingAsync(Guid bookingId);
        Task<bool> VerifyPaymentAsync(Guid paymentId);
        Task ConfirmPaymentAsync(Guid paymentId);
    }

    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly PayOS _payOS;
        private readonly IStripeClient _stripeClient;
        private readonly ILogger<PaymentService> _logger;
        private readonly IEmailService _emailService;
        private readonly IQRCodeService _qrCodeService;

        public PaymentService(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<PaymentService> logger,
            IEmailService emailService,
            IQRCodeService qrCodeService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
            _qrCodeService = qrCodeService;

            // Khởi tạo PayOS
            _payOS = new PayOS(
                configuration["PayOS:ClientId"],
                configuration["PayOS:ApiKey"], 
                configuration["PayOS:ChecksumKey"]
            );

            // Khởi tạo Stripe
            _stripeClient = new StripeClient(configuration["Stripe:SecretKey"]);
        }

        public async Task<PaymentIntentDto> CreatePaymentIntentAsync(CreatePaymentDto request)
        {
            var booking = await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId);

            if (booking == null)
                throw new Exception("Booking not found");

            // Tạo payment record
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = request.BookingId,
                Amount = request.Amount,
                Currency = "VND",
                PaymentMethod = request.PaymentMethod,
                Status = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Tạo payment intent theo method
            if (request.PaymentMethod == "Stripe")
            {
                return await CreateStripeIntent(payment, booking);
            }
            else if (request.PaymentMethod == "PayOS")
            {
                return await CreatePayOSPayment(payment, booking, request);
            }

            throw new Exception("Unsupported payment method");
        }

        private async Task<PaymentIntentDto> CreateStripeIntent(Payment payment, Booking booking)
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(payment.Amount * 100),
                Currency = "usd",
                PaymentMethodTypes = new List<string> { "card" },
                Metadata = new Dictionary<string, string>
                {
                    ["payment_id"] = payment.Id.ToString(),
                    ["booking_id"] = booking.Id.ToString()
                }
            };

            var service = new PaymentIntentService(_stripeClient);
            var intent = await service.CreateAsync(options);

            payment.ExternalPaymentId = intent.Id;
            await _context.SaveChangesAsync();

            return new PaymentIntentDto
            {
                ClientSecret = intent.ClientSecret,
                PaymentIntentId = intent.Id,
                Amount = payment.Amount,
                Currency = "usd"
            };
        }

        private async Task<PaymentIntentDto> CreatePayOSPayment(Payment payment, Booking booking, CreatePaymentDto request)
        {
            var orderCode = int.Parse(DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()[^8..]);

            var paymentData = new PaymentData
            {
                orderCode = orderCode,
                amount = (int)payment.Amount,
                description = $"Thanh toán vé {booking.Event.Name}",
                buyerName = booking.User.FullName,
                buyerEmail = booking.User.Email,
                buyerPhone = "",
                returnUrl = request.ReturnUrl ?? "https://yourdomain.com/payment-success",
                cancelUrl = request.CancelUrl ?? "https://yourdomain.com/payment-cancel"
            };

            var paymentLink = await _payOS.createPaymentLink(paymentData);

            payment.ExternalPaymentId = orderCode.ToString();
            await _context.SaveChangesAsync();

            return new PaymentIntentDto
            {
                ClientSecret = null,
                PaymentIntentId = orderCode.ToString(),
                Amount = payment.Amount,
                Currency = "VND",
                CheckoutUrl = paymentLink.checkoutUrl
            };
        }

        public async Task ProcessStripeWebhook(string json, string signature)
        {
            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    json, signature, "whsec_your_webhook_secret");

                if (stripeEvent.Type == "payment_intent.succeeded")
                {
                    var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
                    await ConfirmPaymentByExternalId(paymentIntent.Id);
                }
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe webhook error");
                throw;
            }
        }

        public async Task ProcessPayOSWebhook(PaymentCallbackDto callback)
        {
            try
            {
                if (callback.Code == "00" && callback.Status == "PAID")
                {
                    await ConfirmPaymentByExternalId(callback.OrderCode.ToString());
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PayOS webhook error");
                throw;
            }
        }

        private async Task ConfirmPaymentByExternalId(string externalId)
        {
            var payment = await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.ExternalPaymentId == externalId);

            if (payment != null)
            {
                await ConfirmPaymentAsync(payment.Id);
            }
        }

        public async Task ConfirmPaymentAsync(Guid paymentId)
        {
            var payment = await _context.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b.User)
                .Include(p => p.Booking)
                    .ThenInclude(b => b.Event)
                .FirstOrDefaultAsync(p => p.Id == paymentId);

            if (payment == null) return;

            // Payment confirmation flow
            payment.Status = PaymentStatus.Completed;
            payment.PaidAt = DateTime.UtcNow;
            payment.Booking.Status = BookingStatus.Confirmed;
            payment.Booking.ExpiresAt = null;

            await _context.SaveChangesAsync();

            // Generate QR codes
            await GenerateTicketsForBooking(payment.BookingId);

            // Send confirmation email
            await SendPaymentConfirmationEmail(payment.BookingId);
        }

        private async Task GenerateTicketsForBooking(Guid bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Tickets)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking != null && booking.Tickets.Any())
            {
                foreach (var ticket in booking.Tickets)
                {
                    var qrCodeData = $"{ticket.Id}|{ticket.Booking.EventId}";
                    ticket.QrCodeData = await _qrCodeService.GenerateQRCodeAsync(qrCodeData);
                }
                await _context.SaveChangesAsync();
            }
        }

        private async Task SendPaymentConfirmationEmail(Guid bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Event)
                .Include(b => b.Tickets)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking != null)
            {
                await _emailService.SendPaymentConfirmationAsync(
                    booking.User.Email,
                    booking.User.FullName,
                    booking.Event.Name,
                    booking.TotalAmount,
                    booking.Tickets.Count
                );
            }
        }

        public async Task<PaymentDetailDto> GetPaymentAsync(Guid id)
        {
            var payment = await _context.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b.Event)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payment == null) return null;

            return new PaymentDetailDto
            {
                Id = payment.Id,
                BookingId = payment.BookingId,
                BookingNumber = payment.Booking.BookingNumber,
                EventName = payment.Booking.Event.Name,
                Amount = payment.Amount,
                Currency = payment.Currency,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status.ToString(),
                ExternalPaymentId = payment.ExternalPaymentId,
                CreatedAt = payment.CreatedAt,
                PaidAt = payment.PaidAt,
                ExpiresAt = payment.ExpiresAt
            };
        }

        public async Task<List<PaymentDetailDto>> GetPaymentsByBookingAsync(Guid bookingId)
        {
            var payments = await _context.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b.Event)
                .Where(p => p.BookingId == bookingId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return payments.Select(p => new PaymentDetailDto
            {
                Id = p.Id,
                BookingId = p.BookingId,
                BookingNumber = p.Booking.BookingNumber,
                EventName = p.Booking.Event.Name,
                Amount = p.Amount,
                Currency = p.Currency,
                PaymentMethod = p.PaymentMethod,
                Status = p.Status.ToString(),
                ExternalPaymentId = p.ExternalPaymentId,
                CreatedAt = p.CreatedAt,
                PaidAt = p.PaidAt,
                ExpiresAt = p.ExpiresAt
            }).ToList();
        }

        public async Task<bool> VerifyPaymentAsync(Guid paymentId)
        {
            var payment = await _context.Payments.FindAsync(paymentId);
            return payment?.Status == PaymentStatus.Completed;
        }
    }
}