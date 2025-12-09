using FluentValidation;
using Tickify.DTOs.Event;

namespace Tickify.Validators.Event;

/// <summary>
/// Validator cho CreateEventDto
/// Kiểm tra: Title, Description, Location, Dates, CategoryId, etc.
/// </summary>
public class CreateEventValidator : AbstractValidator<CreateEventDto>
{
    public CreateEventValidator()
    {
        // Title validation
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tên sự kiện là bắt buộc")
            .MinimumLength(5).WithMessage("Tên sự kiện phải có ít nhất 5 ký tự")
            .MaximumLength(200).WithMessage("Tên sự kiện không được dài quá 200 ký tự");

        // Description validation
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Mô tả sự kiện là bắt buộc")
            .MinimumLength(50).WithMessage("Mô tả phải có ít nhất 50 ký tự")
            .MaximumLength(5000).WithMessage("Mô tả không được dài quá 5000 ký tự");

        // Venue validation
        RuleFor(x => x.Venue)
            .NotEmpty().WithMessage("Địa điểm là bắt buộc")
            .MaximumLength(500).WithMessage("Địa điểm không được dài quá 500 ký tự");

        // StartDate validation - STRICT: Must be at least 24 hours in the future
        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Ngày bắt đầu là bắt buộc")
            .Must(startDate => startDate > DateTime.UtcNow)
            .WithMessage("Ngày bắt đầu không được ở trong quá khứ")
            .Must(startDate => startDate >= DateTime.UtcNow.AddHours(24))
            .WithMessage("Sự kiện phải được đặt lịch trước ít nhất 24 giờ");

        // EndDate validation - Must be after start date
        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("Ngày kết thúc là bắt buộc")
            .GreaterThan(x => x.StartDate)
            .WithMessage("Ngày kết thúc phải sau ngày bắt đầu")
            .Must((dto, endDate) => endDate - dto.StartDate <= TimeSpan.FromDays(30))
            .WithMessage("Thời lượng sự kiện không được vượt quá 30 ngày");

        // CategoryId validation
        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("CategoryId phải lớn hơn 0");

        // OrganizerId validation
        RuleFor(x => x.OrganizerId)
            .GreaterThan(0).WithMessage("OrganizerId phải lớn hơn 0");

        // TotalSeats validation
        RuleFor(x => x.TotalSeats)
            .GreaterThan(0).WithMessage("Tổng số ghế phải lớn hơn 0")
            .LessThanOrEqualTo(100000).WithMessage("Tổng số ghế không được vượt quá 100,000");
    }
}
