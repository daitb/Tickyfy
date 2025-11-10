namespace Tickify.DTOs.Event;

public class EventFilterDto
{
    public string? SearchTerm { get; set; }

    public int? CategoryId { get; set; }

    public int? OrganizerId { get; set; }

    public string? Status { get; set; }

    public DateTime? StartDateFrom { get; set; }

    public DateTime? StartDateTo { get; set; }

    public decimal? MinPrice { get; set; }

    public decimal? MaxPrice { get; set; }

    public bool? IsFeatured { get; set; }

    public string? Location { get; set; }

    public string SortBy { get; set; } = "StartDate";

    public string SortOrder { get; set; } = "asc";

    public int PageNumber { get; set; } = 1;

    public int PageSize { get; set; } = 20;

    public void ValidatePageSize()
    {
        if (PageSize > 100) PageSize = 100;
        if (PageSize < 1) PageSize = 20;
        if (PageNumber < 1) PageNumber = 1;
    }
}
