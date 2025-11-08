namespace Tickify.DTOs.Payment
{
    public sealed class RefundDto
    {
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; } = default!;
    }
}