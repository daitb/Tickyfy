using FluentValidation;
using Tickify.DTOs.Waitlist;

namespace Tickify.Validators.Waitlist
{
    public class JoinWaitlistValidator : AbstractValidator<JoinWaitlistDto>
    {
        public JoinWaitlistValidator()
        {
            RuleFor(x => x.EventId)
                .NotEmpty().WithMessage("EventId is required");

            RuleFor(x => x.TicketTypeId)
                .NotEmpty().WithMessage("TicketTypeId is required");

            RuleFor(x => x.Quantity)
                .InclusiveBetween(1, 10).WithMessage("Quantity must be between 1 and 10");

            RuleFor(x => x.NotificationEmail)
                .EmailAddress().When(x => !string.IsNullOrEmpty(x.NotificationEmail))
                .WithMessage("Notification email must be valid");
        }
    }
}