using FluentValidation;
using Tickify.DTOs.PromoCode;

namespace Tickify.Validators.PromoCode;

public class ValidatePromoCodeValidator : AbstractValidator<ValidatePromoCodeDto>
{
    public ValidatePromoCodeValidator()
    {
        RuleFor(x => x.Code)
<<<<<<< Updated upstream
            .NotEmpty().WithMessage("Mã giảm giá là bắt buộc");

        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");
=======
            .NotEmpty().WithMessage("Mã giảm giá là bắt buộc")
            .MaximumLength(50).WithMessage("Mã giảm giá không được dài quá 50 ký tự");

        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");

        RuleFor(x => x.OrderTotal)
            .GreaterThanOrEqualTo(0).WithMessage("Tổng giá trị đơn hàng phải lớn hơn hoặc bằng 0");
>>>>>>> Stashed changes
    }
}
