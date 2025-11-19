namespace Tickify.DTOs.Payout;

public class PayoutStatsDto
{
    public int OrganizerId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public decimal TotalRevenue { get; set; }
    public decimal TotalPlatformFees { get; set; }
    public decimal TotalEarnings { get; set; }
    public decimal PendingPayouts { get; set; }
    public decimal ApprovedPayouts { get; set; }
    public decimal ProcessedPayouts { get; set; }
    public int TotalPayoutRequests { get; set; }
    public int PendingPayoutRequests { get; set; }
}

