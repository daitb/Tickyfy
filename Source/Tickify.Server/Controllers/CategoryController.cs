using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Common;
using Tickify.DTOs.Category;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Route("api/categories")]
[Produces("application/json")]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly ILogger<CategoryController> _logger;

    public CategoryController(
        ICategoryService categoryService,
        ILogger<CategoryController> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<CategoryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetCategories()
    {
        _logger.LogInformation("Fetching all categories");

        var categories = await _categoryService.GetAllCategoriesAsync();

        return Ok(ApiResponse<List<CategoryDto>>.SuccessResponse(
            categories,
            $"Retrieved {categories.Count} categories"
        ));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> GetCategoryById(int id)
    {
        _logger.LogInformation("Fetching category with ID: {CategoryId}", id);

        var category = await _categoryService.GetCategoryByIdAsync(id);

        if (category == null)
        {
            return NotFound(ApiResponse<CategoryDto>.FailureResponse(
                $"Category with ID {id} not found"
            ));
        }

        return Ok(ApiResponse<CategoryDto>.SuccessResponse(
            category,
            "Category details retrieved successfully"
        ));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory(
        [FromBody] CreateCategoryDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<CategoryDto>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        _logger.LogInformation("Creating new category: {CategoryName}", dto.CategoryName);

        var createdCategory = await _categoryService.CreateCategoryAsync(dto);

        return CreatedAtAction(
            nameof(GetCategoryById),
            new { id = createdCategory.CategoryId },
            ApiResponse<CategoryDto>.SuccessResponse(
                createdCategory,
                "Category created successfully"
            )
        );
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(
        int id,
        [FromBody] UpdateCategoryDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(ApiResponse<CategoryDto>.FailureResponse(
                "Validation failed",
                errors
            ));
        }

        _logger.LogInformation("Updating category ID: {CategoryId}", id);

        var updatedCategory = await _categoryService.UpdateCategoryAsync(id, dto);

        return Ok(ApiResponse<CategoryDto>.SuccessResponse(
            updatedCategory,
            "Category updated successfully"
        ));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCategory(int id)
    {
        _logger.LogInformation("Deleting category ID: {CategoryId}", id);

        var result = await _categoryService.DeleteCategoryAsync(id);

        return Ok(ApiResponse<bool>.SuccessResponse(
            result,
            "Category deleted successfully"
        ));
    }
}
