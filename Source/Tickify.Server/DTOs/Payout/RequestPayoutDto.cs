namespace Tickify.DTOs.Payout;

public class RequestPayoutDto
{
    public int EventId { get; set; }
    public decimal Amount { get; set; }
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string AccountHolderName { get; set; } = string.Empty;
}
