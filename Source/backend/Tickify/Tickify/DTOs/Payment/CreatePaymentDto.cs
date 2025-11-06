using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Payment
{
    public class CreatePaymentDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        public string PaymentMethod { get; set; } = "PayOS"; // PayOS, Stripe, VNPay, MOMO
        
        [Required]
        public decimal Amount { get; set; }
        
        public string? ReturnUrl { get; set; }
        public string? CancelUrl { get; set; }
        public string? Description { get; set; }
        
        // Thông tin người dùng cho payOS
        public string? CustomerName { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerPhone { get; set; }
    }

    public class PaymentResponseDto
    {
        public string PaymentId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? CheckoutUrl { get; set; } // payOS, VNPay
        public string? ClientSecret { get; set; } // Stripe
        public string? QrCode { get; set; } // MOMO
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    public class PaymentCallbackDto
    {
        public string Code { get; set; } = string.Empty;
        public string Id { get; set; } = string.Empty;
        public bool Cancel { get; set; }
        public string Status { get; set; } = string.Empty;
        public int OrderCode { get; set; }
    }
}