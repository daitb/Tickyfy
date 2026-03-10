using FluentValidation;
using Tickify.DTOs.Support;

namespace Tickify.Validators.Support;

public class CreateSupportTicketValidator : AbstractValidator<CreateSupportTicketDto>
{
    public CreateSupportTicketValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MinimumLength(2).WithMessage("Name must be at least 2 characters")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subject is required")
            .MinimumLength(5).WithMessage("Subject must be at least 5 characters")
            .MaximumLength(200).WithMessage("Subject cannot exceed 200 characters");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .MinimumLength(10).WithMessage("Message must be at least 10 characters")
            .MaximumLength(2000).WithMessage("Message cannot exceed 2000 characters");
    }
}
