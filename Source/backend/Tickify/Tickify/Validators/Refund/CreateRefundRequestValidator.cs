using FluentValidation;
using Tickify.DTOs.Refund;

namespace Tickify.Validators.Refund;

public class CreateRefundRequestValidator : AbstractValidator<CreateRefundRequestDto>
{
    public CreateRefundRequestValidator()
    {
        RuleFor(x => x.BookingId)
            .GreaterThan(0).WithMessage("BookingId phải lớn hơn 0");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Lý do hoàn tiền là bắt buộc")
            .MinimumLength(20).WithMessage("Lý do phải có ít nhất 20 ký tự")
            .MaximumLength(500).WithMessage("Lý do không được dài quá 500 ký tự");
    }
}
