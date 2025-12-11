using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Payment
{
    /// <summary>
    /// DTO for creating credit card payment with comprehensive card details validation
    /// </summary>
    public class CreditCardPaymentDto
    {
        [Required(ErrorMessage = "BookingId là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "BookingId phải lớn hơn 0")]
        public int BookingId { get; set; }

        [Required(ErrorMessage = "Provider là bắt buộc")]
        public string Provider { get; set; } = "creditcard";

        [Required(ErrorMessage = "Số thẻ là bắt buộc")]
        [RegularExpression(@"^\d{13,19}$", ErrorMessage = "Số thẻ không hợp lệ (13-19 chữ số)")]
        public string CardNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên chủ thẻ là bắt buộc")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Tên chủ thẻ phải từ 2-100 ký tự")]
        [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Tên chủ thẻ chỉ được chứa chữ cái và khoảng trắng")]
        public string CardholderName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tháng hết hạn là bắt buộc")]
        [Range(1, 12, ErrorMessage = "Tháng hết hạn phải từ 1-12")]
        public int ExpiryMonth { get; set; }

        [Required(ErrorMessage = "Năm hết hạn là bắt buộc")]
        [Range(2024, 2050, ErrorMessage = "Năm hết hạn không hợp lệ")]
        public int ExpiryYear { get; set; }

        [Required(ErrorMessage = "CVV là bắt buộc")]
        [RegularExpression(@"^\d{3,4}$", ErrorMessage = "CVV phải là 3-4 chữ số")]
        public string CVV { get; set; } = string.Empty;

        // Optional billing information for enhanced validation
        [StringLength(200, ErrorMessage = "Địa chỉ thanh toán không được vượt quá 200 ký tự")]
        public string? BillingAddress { get; set; }

        [StringLength(100, ErrorMessage = "Thành phố không được vượt quá 100 ký tự")]
        public string? BillingCity { get; set; }

        [StringLength(10, ErrorMessage = "Mã bưu điện không được vượt quá 10 ký tự")]
        public string? BillingPostalCode { get; set; }

        [StringLength(100, ErrorMessage = "Quốc gia không được vượt quá 100 ký tự")]
        public string? BillingCountry { get; set; }

        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        [StringLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự")]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự")]
        public string? PhoneNumber { get; set; }
    }

    /// <summary>
    /// Response DTO for successful credit card payment
    /// </summary>
    public class CreditCardPaymentResponseDto
    {
        public int PaymentId { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "VND";
        public string CardBrand { get; set; } = string.Empty;
        public string Last4Digits { get; set; } = string.Empty;
        public DateTime ProcessedAt { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? AuthorizationCode { get; set; }
        public string? ReceiptUrl { get; set; }        public bool IsImmediateCompletion { get; set; } = true;
        public int BookingId { get; set; }    }
}
