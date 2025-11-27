using FluentValidation;
using Tickify.DTOs.Seat;

namespace Tickify.Validators.Seat;

public class CreateSeatValidator : AbstractValidator<CreateSeatDto>
{
    public CreateSeatValidator()
    {
        RuleFor(x => x.TicketTypeId)
            .GreaterThan(0).WithMessage("TicketTypeId must be greater than 0");

        RuleFor(x => x.Row)
            .NotEmpty().WithMessage("Row is required")
            .MaximumLength(10).WithMessage("Row cannot exceed 10 characters");

        RuleFor(x => x.SeatNumber)
            .NotEmpty().WithMessage("Seat number is required")
            .MaximumLength(10).WithMessage("Seat number cannot exceed 10 characters");
    }
}
