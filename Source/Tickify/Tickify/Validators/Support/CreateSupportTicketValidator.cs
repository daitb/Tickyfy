using FluentValidation;
using Tickify.DTOs.Support;

namespace Tickify.Validators.Support
{
    public class CreateSupportTicketValidator : AbstractValidator<CreateSupportTicketDto>
    {
        public CreateSupportTicketValidator()
        {
            RuleFor(x => x.Subject)
                .NotEmpty().WithMessage("Subject is required")
                .MaximumLength(100).WithMessage("Subject cannot exceed 100 characters");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Description is required")
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");

            RuleFor(x => x.Category)
                .NotEmpty().WithMessage("Category is required")
                .Must(category => new[] { "general", "technical", "payment", "refund", "event" }.Contains(category))
                .WithMessage("Category must be one of: general, technical, payment, refund, event");

            RuleFor(x => x.Priority)
                .NotEmpty().WithMessage("Priority is required")
                .Must(priority => new[] { "low", "medium", "high", "urgent" }.Contains(priority))
                .WithMessage("Priority must be one of: low, medium, high, urgent");

            When(x => !string.IsNullOrEmpty(x.RelatedEventId), () =>
            {
                RuleFor(x => x.RelatedEventId)
                    .Must(guid => Guid.TryParse(guid, out _))
                    .WithMessage("RelatedEventId must be a valid GUID");
            });

            When(x => !string.IsNullOrEmpty(x.RelatedBookingId), () =>
            {
                RuleFor(x => x.RelatedBookingId)
                    .Must(guid => Guid.TryParse(guid, out _))
                    .WithMessage("RelatedBookingId must be a valid GUID");
            });
        }
    }
}