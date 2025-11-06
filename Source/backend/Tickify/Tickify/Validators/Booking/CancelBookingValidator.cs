using FluentValidation;
using Tickify.DTOs.Booking;

namespace Tickify.Validators.Booking;

/// <summary>
/// Validator cho CancelBookingDto
/// </summary>
public class CancelBookingValidator : AbstractValidator<CancelBookingDto>
{
    public CancelBookingValidator()
    {
        RuleFor(x => x.BookingId)
            .GreaterThan(0).WithMessage("BookingId phải lớn hơn 0");

        RuleFor(x => x.CancellationReason)
            .MaximumLength(500).WithMessage("Lý do hủy không được dài quá 500 ký tự")
            .When(x => !string.IsNullOrEmpty(x.CancellationReason));
    }
}
