namespace Tickify.DTOs.Refund;

public sealed class RejectRefundDto
{
    public string Reason { get; set; } = "Not eligible";
}