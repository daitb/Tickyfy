using FluentValidation;
using Tickify.DTOs.PromoCode;

namespace Tickify.Validators.PromoCode;

public class CreatePromoCodeValidator : AbstractValidator<CreatePromoCodeDto>
{
    public CreatePromoCodeValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Promo code is required")
            .Length(4, 20).WithMessage("Promo code must be between 4 and 20 characters")
            .Matches("^[A-Z0-9]+$").WithMessage("Promo code can only contain uppercase letters and numbers");

        RuleFor(x => x.Description)
            .MaximumLength(200).WithMessage("Description cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId must be greater than 0")
            .When(x => x.EventId.HasValue);

        RuleFor(x => x.OrganizerId)
            .GreaterThan(0).WithMessage("OrganizerId must be greater than 0")
            .When(x => x.OrganizerId.HasValue);

        // Either discount percent or discount amount must be provided, but not both
        RuleFor(x => x)
            .Must(x => x.DiscountPercent.HasValue || x.DiscountAmount.HasValue)
            .WithMessage("Either discount percentage or discount amount must be specified");

        RuleFor(x => x)
            .Must(x => !(x.DiscountPercent.HasValue && x.DiscountAmount.HasValue))
            .WithMessage("Cannot specify both discount percentage and discount amount");

        RuleFor(x => x.DiscountPercent)
            .InclusiveBetween(1, 100).WithMessage("Discount percentage must be between 1 and 100")
            .When(x => x.DiscountPercent.HasValue);

        RuleFor(x => x.DiscountAmount)
            .GreaterThan(0).WithMessage("Discount amount must be greater than 0")
            .When(x => x.DiscountAmount.HasValue);

        RuleFor(x => x.MinimumPurchase)
            .GreaterThanOrEqualTo(0).WithMessage("Minimum purchase must be greater than or equal to 0")
            .When(x => x.MinimumPurchase.HasValue);

        RuleFor(x => x.MaxUses)
            .GreaterThan(0).WithMessage("Max uses must be greater than 0")
            .When(x => x.MaxUses.HasValue);

        RuleFor(x => x.MaxUsesPerUser)
            .GreaterThan(0).WithMessage("Max uses per user must be greater than 0")
            .When(x => x.MaxUsesPerUser.HasValue);

        RuleFor(x => x)
            .Must(x => !x.ValidFrom.HasValue || !x.ValidTo.HasValue || x.ValidFrom.Value < x.ValidTo.Value)
            .WithMessage("Valid from date must be before valid to date");
    }
}