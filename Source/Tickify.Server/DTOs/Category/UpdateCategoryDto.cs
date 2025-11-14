namespace Tickify.DTOs.Category;

public class UpdateCategoryDto
{
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
}
