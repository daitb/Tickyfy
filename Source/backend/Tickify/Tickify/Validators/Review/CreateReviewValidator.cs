// Validators/Reviews/CreateReviewValidator.cs
using FluentValidation;
using Tickify.DTOs.Review;

namespace Tickify.Validators.Reviews;
public sealed class CreateReviewValidator : AbstractValidator<CreateReviewDto>
{
    public CreateReviewValidator()
    {
        RuleFor(x => x.EventId).GreaterThan(0);
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Comment).MaximumLength(1000);
    }
}
