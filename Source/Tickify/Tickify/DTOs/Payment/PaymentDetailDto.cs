using Tickify.DTOs.Booking;

namespace Tickify.DTOs.Payment
{
    public class PaymentDetailDto : PaymentDto
    {
        public BookingDto? Booking { get; set; }
        public string? FailureReason { get; set; }
        public string? PaymentUrl { get; set; } // For payOS & VNPay
        public string? QRCode { get; set; } // payOS QR code data
        public string? CheckoutUrl { get; set; } // payOS checkout URL
        public string? PayerEmail { get; set; }
        public string? PayerName { get; set; }
        public string? PaymentGateway { get; set; } // payos, vnpay
    }
}