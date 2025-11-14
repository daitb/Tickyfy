namespace Tickify.DTOs.TicketType;

public class TicketTypeDto
{
    public int TicketTypeId { get; set; }
    public int EventId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public int AvailableQuantity { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
