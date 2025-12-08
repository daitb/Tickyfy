using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Payment
{
    /// <summary>
    /// DTO for creating credit card payment with card details validation
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
    }
}
