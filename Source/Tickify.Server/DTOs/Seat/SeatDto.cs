namespace Tickify.DTOs.Seat;

public class SeatDto
{
    public int Id { get; set; }
    public int TicketTypeId { get; set; }
    public int? SeatZoneId { get; set; }
    
    public string Row { get; set; } = string.Empty;
    public string SeatNumber { get; set; } = string.Empty;
    public string FullSeatCode { get; set; } = string.Empty;
    
    public int? GridRow { get; set; }
    public int? GridColumn { get; set; }
    
    public string Status { get; set; } = "Available";
    public bool IsBlocked { get; set; }
    public string? BlockedReason { get; set; }
    
    public int? ReservedByUserId { get; set; }
    public DateTime? ReservedUntil { get; set; }
    
    // Additional info from relationships
    public string? TicketTypeName { get; set; }
    public decimal? TicketTypePrice { get; set; }
    public string? ZoneName { get; set; }
}
