using FluentValidation;
using Tickify.DTOs.Seat;

namespace Tickify.Validators.Seat;

/// <summary>
/// Validator cho SeatSelectionDto
/// </summary>
public class SeatSelectionValidator : AbstractValidator<SeatSelectionDto>
{
    public SeatSelectionValidator()
    {
        RuleFor(x => x.SeatId)
            .GreaterThan(0).WithMessage("SeatId phải lớn hơn 0");

        RuleFor(x => x.SeatNumber)
            .NotEmpty().WithMessage("Số ghế là bắt buộc")
            .MaximumLength(20).WithMessage("Số ghế không được dài quá 20 ký tự");
    }
}
