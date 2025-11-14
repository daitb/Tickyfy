namespace Tickify.DTOs.Booking;

public class BookingDetailDto
{
    public int BookingId { get; set; }
    public string BookingNumber { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public string EventVenue { get; set; } = string.Empty;
    public DateTime EventStartDate { get; set; }
    
    public int Quantity { get; set; }
    public decimal SubTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalPrice { get; set; }
    
    public string Status { get; set; } = string.Empty;
    public string? PromoCode { get; set; }
    
    public List<BookingTicketDto> Tickets { get; set; } = new();
    
    public DateTime BookingDate { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public class BookingTicketDto
{
    public int TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string TicketTypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? SeatNumber { get; set; }
    public string Status { get; set; } = string.Empty;
}
