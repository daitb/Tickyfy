using FluentValidation;
using Tickify.DTOs.Ticket;

namespace Tickify.Validators.Ticket;
public class TicketScanValidator : AbstractValidator<TicketScanDto>
{
    public TicketScanValidator()
    {
        RuleFor(x => x.TicketNumber)
            .NotEmpty().WithMessage("Số vé là bắt buộc")
            .MaximumLength(50).WithMessage("Số vé không được dài quá 50 ký tự");

        RuleFor(x => x.EventId)
            .GreaterThan(0).WithMessage("EventId phải lớn hơn 0");

        RuleFor(x => x.QrCode)
            .MaximumLength(500).WithMessage("Mã QR không hợp lệ")
            .When(x => !string.IsNullOrEmpty(x.QrCode));
    }
}
