using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Refund
{
public sealed class CreateRefundRequestDto
{
    public int BookingId { get; set; }
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
}


}