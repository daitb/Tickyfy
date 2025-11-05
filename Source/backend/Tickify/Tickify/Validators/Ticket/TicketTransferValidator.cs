using FluentValidation;
using Tickify.DTOs.Ticket;

namespace Tickify.Validators.Ticket;

public class TicketTransferValidator : AbstractValidator<TicketTransferDto>
{
    public TicketTransferValidator()
    {
        RuleFor(x => x.RecipientEmail)
            .NotEmpty().WithMessage("Email người nhận là bắt buộc")
            .EmailAddress().WithMessage("Email không đúng định dạng");
    }
}
