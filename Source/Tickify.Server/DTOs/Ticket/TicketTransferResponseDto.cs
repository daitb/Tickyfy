namespace Tickify.DTOs.Ticket;

public class TicketTransferResponseDto
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public int FromUserId { get; set; }
    public string FromUserName { get; set; } = string.Empty;
    public string FromUserEmail { get; set; } = string.Empty;
    public int ToUserId { get; set; }
    public string ToUserName { get; set; } = string.Empty;
    public string ToUserEmail { get; set; } = string.Empty;
    public DateTime TransferredAt { get; set; }
    public string? Reason { get; set; }
    public bool IsApproved { get; set; }
    public DateTime? AcceptanceExpiresAt { get; set; }
    public bool IsExpired => AcceptanceExpiresAt.HasValue && AcceptanceExpiresAt.Value < DateTime.UtcNow;
}

