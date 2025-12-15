namespace Tickify.DTOs.Refund;

public class RefundRequestDto
{
    public int RefundId { get; set; }
    public int BookingId { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string EventTitle { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
