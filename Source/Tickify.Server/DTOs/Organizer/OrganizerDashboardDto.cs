using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Organizer;

public class OrganizerEventDashboardDto
{
    public int EventId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
    public int SoldSeats { get; set; }
    public decimal Revenue { get; set; }
}

public class OrganizerTopEventDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int TicketsSold { get; set; }
}

public class OrganizerMonthlyRevenueDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int TicketsSold { get; set; }
}

public class OrganizerEarningsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalPlatformFee { get; set; }
    public decimal NetEarnings { get; set; }
    public decimal CompletedPayouts { get; set; }
    public decimal PendingPayouts { get; set; }
    public decimal AvailableBalance { get; set; }
    public int TotalTicketsSold { get; set; }
    public List<OrganizerMonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
    public List<OrganizerTopEventDto> TopEvents { get; set; } = new();
}

