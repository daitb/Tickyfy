using Tickify.Common;

namespace Tickify.DTOs.Payment
{
    public class PaymentDto
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // pending, processing, completed, failed, refunded
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "VND";
        public string? TransactionId { get; set; } // From payOS/VNPay
        public string? OrderCode { get; set; } // payOS order code
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? ExpiredAt { get; set; } // payOS payment expiration
    }
}