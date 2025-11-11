namespace Tickify.DTOs.Payment
{
    public sealed class PaymentIntentDto
    {
        public string Provider { get; set; } = default!;
        public int PaymentId { get; set; }
        public string RedirectUrl { get; set; } = default!;
        public DateTime ExpiresAtUtc { get; set; }
    }
}