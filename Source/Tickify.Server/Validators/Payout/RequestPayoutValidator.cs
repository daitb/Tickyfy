using FluentValidation;
using Tickify.DTOs.Payout;

namespace Tickify.Validators.Payout;

public sealed class RequestPayoutValidator : AbstractValidator<RequestPayoutDto>
{
    public RequestPayoutValidator()
    {
        RuleFor(x => x.EventId)
            .GreaterThan(0)
            .WithMessage("EventId phải lớn hơn 0.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Số tiền yêu cầu phải lớn hơn 0.")
            .LessThanOrEqualTo(1000000000) // 1 billion VND
            .WithMessage("Số tiền yêu cầu không được vượt quá 1,000,000,000 VND.");

        RuleFor(x => x.BankAccountNumber)
            .NotEmpty()
            .WithMessage("Số tài khoản ngân hàng là bắt buộc.")
            .Length(8, 20)
            .WithMessage("Số tài khoản ngân hàng phải có từ 8 đến 20 ký tự.")
            .Matches(@"^\d+$")
            .WithMessage("Số tài khoản ngân hàng chỉ được chứa số.");

        RuleFor(x => x.BankName)
            .NotEmpty()
            .WithMessage("Tên ngân hàng là bắt buộc.")
            .MaximumLength(100)
            .WithMessage("Tên ngân hàng không được vượt quá 100 ký tự.");

        RuleFor(x => x.AccountHolderName)
            .NotEmpty()
            .WithMessage("Tên chủ tài khoản là bắt buộc.")
            .MaximumLength(100)
            .WithMessage("Tên chủ tài khoản không được vượt quá 100 ký tự.")
            .Matches(@"^[a-zA-ZÀ-ỹ\s]+$")
            .WithMessage("Tên chủ tài khoản chỉ được chứa chữ cái và khoảng trắng.");
    }
}

