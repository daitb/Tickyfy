namespace Tickify.DTOs.Event;

public class EventStatsDto
{
    public int EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;

    // Sales statistics
    public int TotalBookings { get; set; }
    public int TotalTicketsSold { get; set; }
    public int TotalSeats { get; set; }
    public int AvailableSeats { get; set; }
    public decimal SalesPercentage { get; set; }

    // Revenue statistics
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }

    // Review statistics
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }

    // Attendance (for completed events)
    public int? TotalAttendees { get; set; }
    public decimal? AttendanceRate { get; set; }

    // Ticket type breakdown
    public List<TicketTypeSalesDto> TicketTypeSales { get; set; } = new();

    // Time-based sales
    public DateTime? FirstSaleDate { get; set; }
    public DateTime? LastSaleDate { get; set; }

    // Sales over time
    public List<SalesByDateDto> SalesByDate { get; set; } = new();

    // Top buyers
    public List<TopBuyerDto> TopBuyers { get; set; } = new();

    // Recent transactions
    public List<RecentTransactionDto> RecentTransactions { get; set; } = new();

    // Additional metrics
    public int PageViews { get; set; }
    public int SoldSeats { get; set; }
}

public class SalesByDateDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int TicketsSold { get; set; }
}

public class TopBuyerDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TicketsPurchased { get; set; }
    public decimal TotalSpent { get; set; }
    public DateTime LastPurchaseDate { get; set; }
}

public class RecentTransactionDto
{
    public string TransactionId { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime TransactionDate { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class TicketTypeSalesDto
{
    public int TicketTypeId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TotalQuantity { get; set; }
    public int SoldQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public decimal Revenue { get; set; }
    public decimal SalesPercentage { get; set; }
}
