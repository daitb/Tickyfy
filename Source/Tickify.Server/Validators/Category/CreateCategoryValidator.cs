using FluentValidation;
using Tickify.DTOs.Category;

namespace Tickify.Validators.Category;

/// <summary>
/// Validator cho CreateCategoryDto
/// Kiểm tra: Name
/// </summary>
public class CreateCategoryValidator : AbstractValidator<CreateCategoryDto>
{
    public CreateCategoryValidator()
    {
        // CategoryName validation
        RuleFor(x => x.CategoryName)
            .NotEmpty().WithMessage("Tên danh mục là bắt buộc")
            .MinimumLength(2).WithMessage("Tên danh mục phải có ít nhất 2 ký tự")
            .MaximumLength(100).WithMessage("Tên danh mục không được dài quá 100 ký tự");

        // Description validation (optional)
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả không được dài quá 500 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
