namespace Tickify.DTOs.Seat;

public class BulkCreateSeatDto
{
    public int TicketTypeId { get; set; }
    public int? SeatZoneId { get; set; }
    
    public List<SeatItem> Seats { get; set; } = new();
}

public class SeatItem
{
    public string Row { get; set; } = string.Empty;
    public string SeatNumber { get; set; } = string.Empty;
    public int? GridRow { get; set; }
    public int? GridColumn { get; set; }
}

