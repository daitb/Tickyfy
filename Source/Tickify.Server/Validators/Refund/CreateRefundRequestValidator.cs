using FluentValidation;
using Tickify.DTOs.Refund;

namespace Tickify.Validators.Refund;
public sealed class CreateRefundRequestValidator : AbstractValidator<CreateRefundRequestDto>
{
    public CreateRefundRequestValidator()
    {
        RuleFor(x => x.BookingId).GreaterThan(0);
        RuleFor(x => x.RefundAmount).GreaterThan(0);
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
    }
}
