namespace Tickify.DTOs.Refund;

public class CreateRefundRequestDto
{
    public int BookingId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
}
