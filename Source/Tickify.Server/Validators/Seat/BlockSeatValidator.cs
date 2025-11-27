using FluentValidation;
using Tickify.DTOs.Seat;

namespace Tickify.Validators.Seat;

public class BlockSeatValidator : AbstractValidator<BlockSeatDto>
{
    public BlockSeatValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters");
    }
}

