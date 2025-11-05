namespace Tickify.DTOs.Payment;

public class RefundDto
{
    public int PaymentId { get; set; }
    public decimal RefundAmount { get; set; }
    public string? Reason { get; set; }
}
