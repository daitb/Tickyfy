using FluentValidation;
using Tickify.DTOs.Support;

namespace Tickify.Validators.Support;

public class CreateSupportTicketValidator : AbstractValidator<CreateSupportTicketDto>
{
    public CreateSupportTicketValidator()
    {
        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Tiêu đề là bắt buộc")
            .MinimumLength(5).WithMessage("Tiêu đề phải có ít nhất 5 ký tự")
            .MaximumLength(200).WithMessage("Tiêu đề không được dài quá 200 ký tự");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Mô tả là bắt buộc")
            .MinimumLength(20).WithMessage("Mô tả phải có ít nhất 20 ký tự")
            .MaximumLength(2000).WithMessage("Mô tả không được dài quá 2000 ký tự");

        RuleFor(x => x.Priority)
            .NotEmpty().WithMessage("Priority là bắt buộc")
            .Must(p => new[] { "Low", "Medium", "High", "Critical" }.Contains(p))
            .WithMessage("Priority phải là: Low, Medium, High hoặc Critical");
    }
}
