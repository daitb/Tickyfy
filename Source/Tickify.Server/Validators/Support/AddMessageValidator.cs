using FluentValidation;
using Tickify.DTOs.Support;

namespace Tickify.Validators.Support;

public class AddMessageValidator : AbstractValidator<AddMessageDto>
{
    public AddMessageValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .MaximumLength(2000).WithMessage("Message cannot exceed 2000 characters");

        RuleFor(x => x.IsStaffResponse)
            .NotNull().WithMessage("IsStaffResponse flag is required");
    }
}
