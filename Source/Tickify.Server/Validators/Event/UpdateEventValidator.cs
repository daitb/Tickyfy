using FluentValidation;
using Tickify.DTOs.Event;

namespace Tickify.Validators.Event;

/// <summary>
/// Validator cho UpdateEventDto
/// Tương tự CreateEventValidator nhưng tất cả fields đều optional
/// </summary>
public class UpdateEventValidator : AbstractValidator<UpdateEventDto>
{
    public UpdateEventValidator()
    {
        // CategoryId validation
        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("CategoryId phải lớn hơn 0");

        // Title validation
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tên sự kiện là bắt buộc")
            .MinimumLength(5).WithMessage("Tên sự kiện phải có ít nhất 5 ký tự")
            .MaximumLength(200).WithMessage("Tên sự kiện không được dài quá 200 ký tự");

        // Description validation
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Mô tả là bắt buộc")
            .MinimumLength(50).WithMessage("Mô tả phải có ít nhất 50 ký tự")
            .MaximumLength(5000).WithMessage("Mô tả không được dài quá 5000 ký tự");

        // Venue validation
        RuleFor(x => x.Venue)
            .NotEmpty().WithMessage("Địa điểm là bắt buộc")
            .MaximumLength(500).WithMessage("Địa điểm không được dài quá 500 ký tự");

        // StartDate validation
        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Ngày bắt đầu là bắt buộc")
            .GreaterThanOrEqualTo(DateTime.UtcNow.AddDays(1))
            .WithMessage("Ngày bắt đầu phải sau ngày hiện tại ít nhất 1 ngày");

        // EndDate validation
        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("Ngày kết thúc là bắt buộc")
            .GreaterThan(x => x.StartDate)
            .WithMessage("Ngày kết thúc phải sau ngày bắt đầu");

        // TotalSeats validation
        RuleFor(x => x.TotalSeats)
            .GreaterThan(0).WithMessage("Tổng số ghế phải lớn hơn 0")
            .LessThanOrEqualTo(100000).WithMessage("Tổng số ghế không được vượt quá 100,000");
    }
}
