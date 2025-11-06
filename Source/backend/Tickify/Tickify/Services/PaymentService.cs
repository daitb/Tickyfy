using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using payOS;
using payOS.Models;
using Stripe;
using Tickify.Data;
using Tickify.DTOs.Payment;
using Tickify.Models;

namespace Tickify.Services
{
    public interface IPaymentService
    {
        Task<PaymentResponseDto> CreatePaymentAsync(CreatePaymentDto request);
        Task<bool> VerifyPaymentAsync(string paymentId, string provider);
        Task ProcessPayOSWebhook(PaymentCallbackDto callback);
        Task ProcessStripeWebhook(string json, string signature);
        Task<Payment> GetPaymentAsync(Guid id);
        Task<List<Payment>> GetPaymentsByBookingAsync(Guid bookingId);
    }

    public class PaymentService : IPaymentService
    {
        private readonly PayOS _payOS;
        private readonly IStripeClient _stripeClient;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentService> _logger;
        private readonly PaymentSettings _paymentSettings;

        public PaymentService(
            IOptions<PaymentSettings> paymentSettings,
            ApplicationDbContext context,
            ILogger<PaymentService> logger)
        {
            _paymentSettings = paymentSettings.Value;
            _context = context;
            _logger = logger;

            // Khởi tạo payOS
            _payOS = new PayOS(
                _paymentSettings.PayOS.ClientId,
                _paymentSettings.PayOS.ApiKey,
                _paymentSettings.PayOS.ChecksumKey
            );

            // Khởi tạo Stripe
            _stripeClient = new StripeClient(_paymentSettings.Stripe.SecretKey);
        }

        public async Task<PaymentResponseDto> CreatePaymentAsync(CreatePaymentDto request)
        {
            var booking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Event)
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
                ExpiresAt = DateTime.UtcNow.AddMinutes(30) // 30 phút để hoàn thành
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Xử lý theo phương thức thanh toán
            return request.PaymentMethod.ToUpper() switch
            {
                "PAYOS" => await CreatePayOSPayment(payment, booking, request),
                "STRIPE" => await CreateStripePayment(payment, booking, request),
                "VNPAY" => await CreateVNPayPayment(payment, booking, request),
                "MOMO" => await CreateMoMoPayment(payment, booking, request),
                _ => throw new Exception($"Unsupported payment method: {request.PaymentMethod}")
            };
        }

        private async Task<PaymentResponseDto> CreatePayOSPayment(Payment payment, Booking booking, CreatePaymentDto request)
        {
            try
            {
                var orderCode = int.Parse(DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()[^8..]);

                var paymentData = new PaymentData
                {
                    orderCode = orderCode,
                    amount = (int)request.Amount,
                    description = request.Description ?? $"Thanh toán vé {booking.Event.Name}",
                    buyerName = request.CustomerName ?? booking.User.FullName,
                    buyerEmail = request.CustomerEmail ?? booking.User.Email,
                    buyerPhone = request.CustomerPhone ?? "",
                    returnUrl = request.ReturnUrl ?? _paymentSettings.PayOS.ReturnUrl,
                    cancelUrl = request.CancelUrl ?? _paymentSettings.PayOS.CancelUrl
                };

                var paymentLink = await _payOS.createPaymentLink(paymentData);

                // Lưu orderCode để verify sau
                payment.ExternalPaymentId = orderCode.ToString();
                await _context.SaveChangesAsync();

                return new PaymentResponseDto
                {
                    PaymentId = payment.Id.ToString(),
                    Status = "PENDING",
                    CheckoutUrl = paymentLink.checkoutUrl,
                    PaymentMethod = "PayOS",
                    ExpiresAt = payment.ExpiresAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayOS payment");
                throw new Exception($"PayOS payment creation failed: {ex.Message}");
            }
        }

        private async Task<PaymentResponseDto> CreateStripePayment(Payment payment, Booking booking, CreatePaymentDto request)
        {
            try
            {
                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long)(request.Amount * 100), // Chuyển sang cents
                    Currency = "usd",
                    PaymentMethodTypes = new List<string> { "card" },
                    Metadata = new Dictionary<string, string>
                    {
                        ["booking_id"] = booking.Id.ToString(),
                        ["payment_id"] = payment.Id.ToString()
                    }
                };

                var service = new PaymentIntentService(_stripeClient);
                var intent = await service.CreateAsync(options);

                payment.ExternalPaymentId = intent.Id;
                await _context.SaveChangesAsync();

                return new PaymentResponseDto
                {
                    PaymentId = payment.Id.ToString(),
                    Status = "PENDING",
                    ClientSecret = intent.ClientSecret,
                    PaymentMethod = "Stripe",
                    ExpiresAt = payment.ExpiresAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Stripe payment");
                throw new Exception($"Stripe payment creation failed: {ex.Message}");
            }
        }

        private async Task<PaymentResponseDto> CreateVNPayPayment(Payment payment, Booking booking, CreatePaymentDto request)
        {
            // Triển khai VNPay integration ở đây
            // Tạo URL thanh toán VNPay
            var vnPayUrl = await GenerateVNPayUrl(payment, booking, request);
            
            payment.ExternalPaymentId = $"VNP_{payment.Id}";
            await _context.SaveChangesAsync();

            return new PaymentResponseDto
            {
                PaymentId = payment.Id.ToString(),
                Status = "PENDING",
                CheckoutUrl = vnPayUrl,
                PaymentMethod = "VNPay",
                ExpiresAt = payment.ExpiresAt
            };
        }

        private async Task<PaymentResponseDto> CreateMoMoPayment(Payment payment, Booking booking, CreatePaymentDto request)
        {
            // Triển khai MoMo integration ở đây
            // Tạo QR code hoặc deep link MoMo
            var momoData = await GenerateMoMoPayment(payment, booking, request);
            
            payment.ExternalPaymentId = $"MOMO_{payment.Id}";
            await _context.SaveChangesAsync();

            return new PaymentResponseDto
            {
                PaymentId = payment.Id.ToString(),
                Status = "PENDING",
                QrCode = momoData.QrCode,
                CheckoutUrl = momoData.DeepLink,
                PaymentMethod = "MoMo",
                ExpiresAt = payment.ExpiresAt
            };
        }

        public async Task<bool> VerifyPaymentAsync(string paymentId, string provider)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.Id.ToString() == paymentId);

            if (payment == null) return false;

            return provider.ToUpper() switch
            {
                "PAYOS" => await VerifyPayOSPayment(payment),
                "STRIPE" => await VerifyStripePayment(payment),
                "VNPAY" => await VerifyVNPayPayment(payment),
                "MOMO" => await VerifyMoMoPayment(payment),
                _ => false
            };
        }

        private async Task<bool> VerifyPayOSPayment(Payment payment)
        {
            try
            {
                if (string.IsNullOrEmpty(payment.ExternalPaymentId))
                    return false;

                var orderCode = int.Parse(payment.ExternalPaymentId);
                var paymentInfo = await _payOS.getPaymentLinkInformation(orderCode);

                if (paymentInfo.status == "PAID")
                {
                    payment.Status = PaymentStatus.Completed;
                    payment.PaidAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    
                    // Cập nhật booking status
                    await UpdateBookingStatus(payment.BookingId, BookingStatus.Confirmed);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying PayOS payment");
                return false;
            }
        }

        public async Task ProcessPayOSWebhook(PaymentCallbackDto callback)
        {
            try
            {
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.ExternalPaymentId == callback.OrderCode.ToString());

                if (payment == null) return;

                if (callback.Code == "00" && callback.Status == "PAID")
                {
                    payment.Status = PaymentStatus.Completed;
                    payment.PaidAt = DateTime.UtcNow;
                    
                    // Cập nhật booking status và generate tickets
                    await UpdateBookingStatus(payment.BookingId, BookingStatus.Confirmed);
                    await GenerateTicketsForBooking(payment.BookingId);
                    
                    await _context.SaveChangesAsync();
                    
                    // Gửi email xác nhận
                    await SendPaymentConfirmationEmail(payment.BookingId);
                }
                else if (callback.Cancel || callback.Status == "CANCELLED")
                {
                    payment.Status = PaymentStatus.Cancelled;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PayOS webhook");
                throw;
            }
        }

        // Các methods helper
        private async Task UpdateBookingStatus(Guid bookingId, BookingStatus status)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking != null)
            {
                booking.Status = status;
                await _context.SaveChangesAsync();
            }
        }

        private async Task GenerateTicketsForBooking(Guid bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Tickets)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking != null)
            {
                // Logic generate QR codes và tickets
                // Đã có trong kế hoạch của Developer 3
            }
        }

        private async Task SendPaymentConfirmationEmail(Guid bookingId)
        {
            // Gửi email xác nhận thanh toán
            // Sử dụng EmailService từ Developer 1
        }

        // Các methods khác (GetPaymentAsync, GetPaymentsByBookingAsync, etc.)
        public async Task<Payment> GetPaymentAsync(Guid id)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<Payment>> GetPaymentsByBookingAsync(Guid bookingId)
        {
            return await _context.Payments
                .Where(p => p.BookingId == bookingId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        // Các methods verify cho các provider khác
        private async Task<bool> VerifyStripePayment(Payment payment) { /* implementation */ }
        private async Task<string> GenerateVNPayUrl(Payment payment, Booking booking, CreatePaymentDto request) { /* implementation */ }
        private async Task<MoMoPaymentData> GenerateMoMoPayment(Payment payment, Booking booking, CreatePaymentDto request) { /* implementation */ }
        private async Task<bool> VerifyVNPayPayment(Payment payment) { /* implementation */ }
        private async Task<bool> VerifyMoMoPayment(Payment payment) { /* implementation */ }
        public async Task ProcessStripeWebhook(string json, string signature) { /* implementation */ }
    }

    public class MoMoPaymentData
    {
        public string QrCode { get; set; } = string.Empty;
        public string DeepLink { get; set; } = string.Empty;
    }
}