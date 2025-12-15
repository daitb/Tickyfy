namespace Tickify.DTOs.Payout;

public class RejectPayoutDto
{
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

