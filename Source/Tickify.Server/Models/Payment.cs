namespace Tickify.Models
{
    public enum PaymentStatus
    {
        Pending,
        Completed,
        Failed,
        Refunded
    }

    public enum PaymentMethod
    {
        CreditCard,
        DebitCard,
        VNPay,
        Momo,
        ZaloPay,
        BankTransfer,
        Cash
    }

    public class Payment
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethod Method { get; set; }
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string? TransactionId { get; set; }
        public string? PaymentGateway { get; set; } // VNPay, Momo, ZaloPay
        public string? PaymentResponse { get; set; } // JSON response from gateway
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? InvoiceUrl { get; set; }

        // Navigation properties
        public Booking? Booking { get; set; }
    }
}
