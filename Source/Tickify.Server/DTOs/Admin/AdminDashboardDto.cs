namespace Tickify.DTOs.Admin;

public class AdminDashboardStatsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal PlatformFees { get; set; }
    public int TotalEvents { get; set; }
    public int ActiveEvents { get; set; }
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int TotalOrganizers { get; set; }
    public int PendingEvents { get; set; }
    public int PendingOrganizerRequests { get; set; }
    public decimal RevenueGrowthPercentage { get; set; }
    public decimal UserGrowthPercentage { get; set; }
}

public class MonthlyRevenueDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Users { get; set; }
}

public class CategoryDistributionDto
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class RecentUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime Joined { get; set; }
    public int Orders { get; set; }
    public decimal Spent { get; set; }
}

public class OrganizerListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Events { get; set; }
    public decimal Revenue { get; set; }
    public string Status { get; set; } = string.Empty;
}

