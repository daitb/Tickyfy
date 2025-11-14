namespace Tickify.DTOs.SeatMap
{
    public class CreateSeatMapDto
    {
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TotalRows { get; set; }
        public int TotalColumns { get; set; }
        public string LayoutConfig { get; set; } = "{}";
    }

    public class UpdateSeatMapDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? TotalRows { get; set; }
        public int? TotalColumns { get; set; }
        public string? LayoutConfig { get; set; }
        public bool? IsActive { get; set; }
    }

    public class SeatMapResponseDto
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string LayoutConfig { get; set; } = string.Empty;
        public int TotalRows { get; set; }
        public int TotalColumns { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<SeatZoneResponseDto> Zones { get; set; } = new();
    }

    public class CreateSeatZoneDto
    {
        public int SeatMapId { get; set; }
        public int TicketTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? Description { get; set; }
        public int StartRow { get; set; }
        public int EndRow { get; set; }
        public int StartColumn { get; set; }
        public int EndColumn { get; set; }
        public decimal ZonePrice { get; set; }
    }

    public class SeatZoneResponseDto
    {
        public int Id { get; set; }
        public int SeatMapId { get; set; }
        public int TicketTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? Description { get; set; }
        public int StartRow { get; set; }
        public int EndRow { get; set; }
        public int StartColumn { get; set; }
        public int EndColumn { get; set; }
        public decimal ZonePrice { get; set; }
        public int Capacity { get; set; }
        public int AvailableSeats { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateSeatsDto
    {
        public int TicketTypeId { get; set; }
        public int? SeatZoneId { get; set; }
        public List<SeatDto> Seats { get; set; } = new();
    }

    public class SeatDto
    {
        public string Row { get; set; } = string.Empty;
        public string SeatNumber { get; set; } = string.Empty;
        public int? GridRow { get; set; }
        public int? GridColumn { get; set; }
    }

    public class SeatResponseDto
    {
        public int Id { get; set; }
        public int TicketTypeId { get; set; }
        public int? SeatZoneId { get; set; }
        public string Row { get; set; } = string.Empty;
        public string SeatNumber { get; set; } = string.Empty;
        public string FullSeatCode { get; set; } = string.Empty;
        public int? GridRow { get; set; }
        public int? GridColumn { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsBlocked { get; set; }
        public string? BlockedReason { get; set; }
        public bool IsReserved { get; set; }
        public DateTime? ReservedUntil { get; set; }
    }

    public class ReserveSeatDto
    {
        public List<int> SeatIds { get; set; } = new();
        public int UserId { get; set; }
        public int ReservationMinutes { get; set; } = 15; // Default 15 minutes hold
    }

    public class SeatAvailabilityDto
    {
        public int EventId { get; set; }
        public int? TicketTypeId { get; set; }
        public int? SeatZoneId { get; set; }
    }
}
