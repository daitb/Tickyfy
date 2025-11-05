namespace Tickify.DTOs.Payment;

public class PaymentDetailDto
{
    public int PaymentId { get; set; }
    public int BookingId { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string EventTitle { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public DateTime PaymentDate { get; set; }
}
