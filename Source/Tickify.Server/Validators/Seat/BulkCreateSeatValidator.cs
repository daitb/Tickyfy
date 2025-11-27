using FluentValidation;
using Tickify.DTOs.Seat;

namespace Tickify.Validators.Seat;

public class BulkCreateSeatValidator : AbstractValidator<BulkCreateSeatDto>
{
    public BulkCreateSeatValidator()
    {
        RuleFor(x => x.TicketTypeId)
            .GreaterThan(0).WithMessage("TicketTypeId must be greater than 0");

        RuleFor(x => x.Seats)
            .NotEmpty().WithMessage("At least one seat is required")
            .Must(seats => seats.Count <= 1000).WithMessage("Cannot create more than 1000 seats at once");

        RuleForEach(x => x.Seats).ChildRules(seat =>
        {
            seat.RuleFor(s => s.Row)
                .NotEmpty().WithMessage("Row is required")
                .MaximumLength(10).WithMessage("Row cannot exceed 10 characters");

            seat.RuleFor(s => s.SeatNumber)
                .NotEmpty().WithMessage("Seat number is required")
                .MaximumLength(10).WithMessage("Seat number cannot exceed 10 characters");
        });
    }
}

