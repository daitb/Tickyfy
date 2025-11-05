namespace Tickify.DTOs.Refund;

public class RejectRefundDto
{
    public int RefundId { get; set; }
    public string RejectionReason { get; set; } = string.Empty;
}
