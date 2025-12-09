namespace Tickify.DTOs.Ticket;

public class TicketScanDto
{
    public string TicketNumber { get; set; } = string.Empty;
    public string? QrCode { get; set; }
    public int EventId { get; set; }
    public int? ScannedByUserId { get; set; }
    public string? DeviceId { get; set; }
    public string? ScanLocation { get; set; }
    public string? ScanType { get; set; }
    public string? Notes { get; set; }
}
