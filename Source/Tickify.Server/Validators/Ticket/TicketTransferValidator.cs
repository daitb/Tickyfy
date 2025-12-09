using FluentValidation;
using Tickify.DTOs.Ticket;

namespace Tickify.Validators.Ticket;

public class TicketTransferValidator : AbstractValidator<TicketTransferDto>
{
    public TicketTransferValidator()
    {
        RuleFor(x => x.RecipientEmail)
            .NotEmpty().WithMessage("Email người nhận là bắt buộc")
            .EmailAddress().WithMessage("Email không đúng định dạng")
            .MaximumLength(255).WithMessage("Email không được dài quá 255 ký tự");

        RuleFor(x => x.Message)
            .MaximumLength(500).WithMessage("Tin nhắn không được dài quá 500 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Message));
    }
}
