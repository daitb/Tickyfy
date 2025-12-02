namespace Tickify.DTOs.Category;

public class UpdateCategoryDto
{
    public string? CategoryName { get; set; }
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public bool? IsActive { get; set; }
}
