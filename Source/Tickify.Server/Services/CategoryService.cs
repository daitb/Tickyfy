using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Category;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Tickify.Models;

namespace Tickify.Services;

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(
        ApplicationDbContext context,
        ILogger<CategoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<CategoryDto>> GetAllCategoriesAsync()
    {
        _logger.LogInformation("Fetching all active categories");

        var categories = await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                CategoryId = c.Id,
                CategoryName = c.Name,
                Description = c.Description,
                EventCount = c.Events!.Count(e => e.Status == EventStatus.Published),
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        _logger.LogInformation("Found {Count} active categories", categories.Count);

        return categories;
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
    {
        _logger.LogInformation("Fetching category with ID: {CategoryId}", id);

        var category = await _context.Categories
            .Where(c => c.Id == id && c.IsActive)
            .Select(c => new CategoryDto
            {
                CategoryId = c.Id,
                CategoryName = c.Name,
                Description = c.Description,
                EventCount = c.Events!.Count(e => e.Status == EventStatus.Published),
                CreatedAt = c.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (category == null)
        {
            _logger.LogWarning("Category with ID {CategoryId} not found", id);
        }

        return category;
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
    {
        _logger.LogInformation("Creating new category: {CategoryName}", dto.CategoryName);

        var existingCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.CategoryName.ToLower());

        if (existingCategory != null)
        {
            throw new ConflictException($"Category with name '{dto.CategoryName}' already exists");
        }

        var category = new Category
        {
            Name = dto.CategoryName,
            Description = dto.Description,
            IconUrl = dto.IconUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Category created successfully with ID: {CategoryId}", category.Id);

        return new CategoryDto
        {
            CategoryId = category.Id,
            CategoryName = category.Name,
            Description = category.Description,
            EventCount = 0,
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto dto)
    {
        _logger.LogInformation("Updating category ID: {CategoryId}", id);

        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            throw new NotFoundException($"Category with ID {id} not found");
        }

        if (!string.IsNullOrWhiteSpace(dto.CategoryName) && dto.CategoryName != category.Name)
        {
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.CategoryName.ToLower() && c.Id != id);

            if (existingCategory != null)
            {
                throw new ConflictException($"Category with name '{dto.CategoryName}' already exists");
            }

            category.Name = dto.CategoryName;
        }

        if (dto.Description != null)
        {
            category.Description = dto.Description;
        }

        if (dto.IconUrl != null)
        {
            category.IconUrl = dto.IconUrl;
        }

        if (dto.IsActive.HasValue)
        {
            category.IsActive = dto.IsActive.Value;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} updated successfully", id);

        var eventCount = await _context.Events
            .CountAsync(e => e.CategoryId == id && e.Status == EventStatus.Published);

        return new CategoryDto
        {
            CategoryId = category.Id,
            CategoryName = category.Name,
            Description = category.Description,
            EventCount = eventCount,
            CreatedAt = category.CreatedAt
        };
    }
    public async Task<bool> DeleteCategoryAsync(int id)
    {
        _logger.LogInformation("Deleting category ID: {CategoryId}", id);

        var category = await _context.Categories
            .Include(c => c.Events)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            throw new NotFoundException($"Category with ID {id} not found");
        }

        var hasActiveEvents = category.Events?.Any(e => e.Status == EventStatus.Published) ?? false;

        if (hasActiveEvents)
        {
            throw new BadRequestException(
                "Cannot delete category with active events. Please reassign or delete events first."
            );
        }

        category.IsActive = false;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} deleted successfully", id);

        return true;
    }
}
