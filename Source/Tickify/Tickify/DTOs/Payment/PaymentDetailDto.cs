using Tickify.DTOs.Common;

namespace Tickify.DTOs.Payment
{
    public class PaymentDetailDto : PaymentDto
    {
        public BasicBookingInfo Booking { get; set; } = new();
        public string? FailureReason { get; set; }
        public string? PaymentUrl { get; set; }
        public string? QRCode { get; set; }
        public string? CheckoutUrl { get; set; }
        public string? PayerEmail { get; set; }
        public string? PayerName { get; set; }
        public string? PaymentGateway { get; set; }
        
        // User info for display
        public BasicUserInfo User { get; set; } = new();
    }
}