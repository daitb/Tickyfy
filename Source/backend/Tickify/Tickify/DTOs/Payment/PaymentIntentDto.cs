namespace Tickify.DTOs.Payment;

public class PaymentIntentDto
{
    public int BookingId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "usd";
    public string ClientSecret { get; set; } = string.Empty;
    public string PaymentIntentId { get; set; } = string.Empty;
}
