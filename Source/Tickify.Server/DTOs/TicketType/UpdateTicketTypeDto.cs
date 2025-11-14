namespace Tickify.DTOs.TicketType;

public class UpdateTicketTypeDto
{
    public string TypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string? Description { get; set; }
}
