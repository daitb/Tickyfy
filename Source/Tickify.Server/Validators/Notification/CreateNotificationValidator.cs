using FluentValidation;
using Tickify.DTOs.Notification;

namespace Tickify.Validators.Notification;

public class CreateNotificationValidator : AbstractValidator<CreateNotificationDto>
{
    public CreateNotificationValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("Valid User ID is required");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .MaximumLength(1000).WithMessage("Message cannot exceed 1000 characters");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Notification type is required")
            .MaximumLength(50).WithMessage("Type cannot exceed 50 characters");
    }
}
