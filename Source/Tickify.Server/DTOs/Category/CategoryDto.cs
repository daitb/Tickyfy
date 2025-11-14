namespace Tickify.DTOs.Category;

public class CategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int EventCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
