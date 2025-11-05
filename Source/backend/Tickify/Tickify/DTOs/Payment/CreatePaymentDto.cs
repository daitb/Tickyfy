namespace Tickify.DTOs.Payment;

public class CreatePaymentDto
{
    public int BookingId { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
