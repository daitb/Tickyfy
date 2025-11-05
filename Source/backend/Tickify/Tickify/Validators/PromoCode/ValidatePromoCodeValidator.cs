using FluentValidation;
using Tickify.DTOs.PromoCode;

namespace Tickify.Validators.PromoCode;

public class ValidatePromoCodeValidator : AbstractValidator<ValidatePromoCodeDto>
{
    public ValidatePromoCodeValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã giảm giá là bắt buộc");

        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");
    }
}
