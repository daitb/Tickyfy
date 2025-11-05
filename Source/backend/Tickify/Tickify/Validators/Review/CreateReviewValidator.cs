using FluentValidation;
using Tickify.DTOs.Review;

namespace Tickify.Validators.Review;

public class CreateReviewValidator : AbstractValidator<CreateReviewDto>
{
    public CreateReviewValidator()
    {
        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Đánh giá phải từ 1 đến 5 sao");

        RuleFor(x => x.Comment)
            .MinimumLength(10).WithMessage("Bình luận phải có ít nhất 10 ký tự")
            .MaximumLength(1000).WithMessage("Bình luận không được dài quá 1000 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Comment));
    }
}
