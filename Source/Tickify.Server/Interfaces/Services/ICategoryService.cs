using Tickify.DTOs.Category;

namespace Tickify.Interfaces.Services;

/// Category Service Interface - Business logic for category management
public interface ICategoryService
{
    /// Get all active categories
    Task<List<CategoryDto>> GetAllCategoriesAsync();

    /// Get category details by ID
    Task<CategoryDto?> GetCategoryByIdAsync(int id);

    /// Create new category (Admin only)
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);

    /// Update existing category (Admin only)
    Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto dto);

    /// Delete category (Admin only) - Soft delete
    Task<bool> DeleteCategoryAsync(int id);
}
