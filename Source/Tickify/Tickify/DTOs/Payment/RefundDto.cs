namespace Tickify.DTOs.Payment
{
    public class RefundDto
    {
        public Guid PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? TransactionId { get; set; } // payOS transaction ID for refund
    }
}