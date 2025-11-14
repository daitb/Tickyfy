using FluentValidation;
using Tickify.DTOs.TicketType;

namespace Tickify.Validators.TicketType;

/// <summary>
/// Validator cho CreateTicketTypeDto
/// Kiểm tra: Name, Price, Quantity
/// </summary>
public class CreateTicketTypeValidator : AbstractValidator<CreateTicketTypeDto>
{
    public CreateTicketTypeValidator()
    {
        // EventId validation
        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");

        // TypeName validation
        RuleFor(x => x.TypeName)
            .NotEmpty().WithMessage("Tên loại vé là bắt buộc")
            .MinimumLength(2).WithMessage("Tên loại vé phải có ít nhất 2 ký tự")
            .MaximumLength(100).WithMessage("Tên loại vé không được dài quá 100 ký tự");

        // Price validation
        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Giá vé phải lớn hơn hoặc bằng 0")
            .LessThan(1000000000).WithMessage("Giá vé không hợp lệ (quá lớn)");

        // Quantity validation
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Số lượng vé phải lớn hơn 0")
            .LessThanOrEqualTo(100000).WithMessage("Số lượng vé không được vượt quá 100,000");

        // Description validation (optional)
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả không được dài quá 500 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
