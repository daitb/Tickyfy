namespace Tickify.DTOs.Payment
{
    public class PaymentLinkDto
    {
        public string PaymentUrl { get; set; } = string.Empty;
        public string QRCode { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "VND";
        public string Status { get; set; } = string.Empty;
        public DateTime ExpiredAt { get; set; }
    }
}