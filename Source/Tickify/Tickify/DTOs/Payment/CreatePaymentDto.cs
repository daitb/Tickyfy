using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Payment
{
    public class CreatePaymentDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        public string PaymentMethod { get; set; } = "payos"; // payos, vnpay
        
        public string? PaymentChannel { get; set; } // For VNPay: VNPAYQR, INTCARD, etc.
        
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
        
        public string? ReturnUrl { get; set; } // For redirect after payment
        public string? CancelUrl { get; set; } // For payOS cancel URL
        
        // payOS specific fields
        public string? Description { get; set; }
        public string? BuyerName { get; set; }
        public string? BuyerEmail { get; set; }
        public string? BuyerPhone { get; set; }
        public string? BuyerAddress { get; set; }
    }
}