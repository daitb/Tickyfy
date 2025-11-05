namespace Tickify.DTOs.Payout;

public class PayoutDto
{
    public int PayoutId { get; set; }
    public int OrganizerId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
