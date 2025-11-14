using FluentValidation;
using Tickify.DTOs.Seat;

namespace Tickify.Validators.Seat;

public class CreateSeatValidator : AbstractValidator<CreateSeatDto>
{
    public CreateSeatValidator()
    {
        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");

        RuleFor(x => x.SeatNumber)
            .NotEmpty().WithMessage("Số ghế là bắt buộc")
            .MaximumLength(20).WithMessage("Số ghế không được dài quá 20 ký tự");

        RuleFor(x => x.Section)
            .NotEmpty().WithMessage("Section là bắt buộc")
            .MaximumLength(50).WithMessage("Section không được dài quá 50 ký tự");

        RuleFor(x => x.RowNumber)
            .GreaterThan(0).WithMessage("RowNumber phải lớn hơn 0");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Giá ghế phải lớn hơn hoặc bằng 0");
    }
}
