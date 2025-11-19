namespace Tickify.DTOs.Category;

public class CreateCategoryDto
{
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
}
