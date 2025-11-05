using FluentValidation;
using Tickify.DTOs.Booking;

namespace Tickify.Validators.Booking;

/// <summary>
/// Validator cho CreateBookingDto
/// </summary>
public class CreateBookingValidator : AbstractValidator<CreateBookingDto>
{
    public CreateBookingValidator()
    {
        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");

        RuleFor(x => x.TicketTypeId)
            .GreaterThan(0).WithMessage("TicketTypeId phải lớn hơn 0");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Số lượng phải lớn hơn 0")
            .LessThanOrEqualTo(50).WithMessage("Không được đặt quá 50 vé trong 1 lần");
    }
}
