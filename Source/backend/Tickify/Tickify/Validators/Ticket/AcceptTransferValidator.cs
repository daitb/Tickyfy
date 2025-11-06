using FluentValidation;
using Tickify.DTOs.Ticket;

namespace Tickify.Validators.Ticket;


public class AcceptTransferValidator : AbstractValidator<AcceptTransferDto>
{
    public AcceptTransferValidator()
    {
        RuleFor(x => x.TransferId)
            .GreaterThan(0).WithMessage("TransferId phải lớn hơn 0");

        RuleFor(x => x.AcceptanceToken)
            .NotEmpty().WithMessage("Acceptance token là bắt buộc")
            .MinimumLength(20).WithMessage("Acceptance token không hợp lệ")
            .MaximumLength(255).WithMessage("Acceptance token không hợp lệ");
    }
}
