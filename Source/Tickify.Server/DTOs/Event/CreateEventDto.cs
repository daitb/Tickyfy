namespace Tickify.DTOs.Event;

public class CreateEventDto
{
    public int OrganizerId { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Venue { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalSeats { get; set; }
    public bool IsFeatured { get; set; } = false;
    public int? SeatMapId { get; set; } // ID của seat map có sẵn hoặc null nếu tạo mới
    public List<CreateTicketTypeDto>? TicketTypes { get; set; }
}

public class CreateTicketTypeDto
{
    public string TypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string? Description { get; set; }
}
