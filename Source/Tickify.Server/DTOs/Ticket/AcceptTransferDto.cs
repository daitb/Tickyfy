namespace Tickify.DTOs.Ticket;

public class AcceptTransferDto
{
    public int TransferId { get; set; }
    public string AcceptanceToken { get; set; } = string.Empty;
}
