using FluentValidation;
using Tickify.DTOs.Auth;

namespace Tickify.Validators.Auth;

/// <summary>
/// Validator cho VerifyEmailDto
/// Kiểm tra: Email và Token
/// </summary>
public class VerifyEmailDtoValidator : AbstractValidator<VerifyEmailDto>
{
    public VerifyEmailDtoValidator()
    {
        // Email validation
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc")
            .EmailAddress().WithMessage("Email không đúng định dạng");

        // Token validation
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Token xác thực là bắt buộc");
    }
}
