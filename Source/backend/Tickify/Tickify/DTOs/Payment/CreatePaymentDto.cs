using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Payment
{
    public class CreatePaymentDto
    {
        public int BookingId { get; set; }
        public string Provider { get; set; } = "VNPay"; // VNPay | MoMo
    }

}