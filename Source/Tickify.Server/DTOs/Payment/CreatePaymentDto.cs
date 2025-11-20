using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Payment
{
    public class CreatePaymentDto
    {
        [Required(ErrorMessage = "BookingId là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "BookingId phải lớn hơn 0")]
        public int BookingId { get; set; }

        [Required(ErrorMessage = "Phương thức thanh toán là bắt buộc")]
        [StringLength(50, ErrorMessage = "Provider không được dài quá 50 ký tự")]
        public string Provider { get; set; } = "VNPay"; // VNPay | MoMo
    }

}