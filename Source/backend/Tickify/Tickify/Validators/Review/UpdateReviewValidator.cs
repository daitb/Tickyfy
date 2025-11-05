using FluentValidation;
using Tickify.DTOs.Review;

namespace Tickify.Validators.Review;

public class UpdateReviewValidator : AbstractValidator<UpdateReviewDto>
{
    public UpdateReviewValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating phải từ 1 đến 5");

        RuleFor(x => x.Comment)
            .MinimumLength(10).WithMessage("Comment phải có ít nhất 10 ký tự")
            .MaximumLength(1000).WithMessage("Comment không được dài quá 1000 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Comment));
    }
}
