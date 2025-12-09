using FluentValidation;
using Tickify.DTOs.Waitlist;

namespace Tickify.Validators.Waitlist;

public class JoinWaitlistValidator : AbstractValidator<JoinWaitlistDto>
{
    public JoinWaitlistValidator()
    {
        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");
    }
}
