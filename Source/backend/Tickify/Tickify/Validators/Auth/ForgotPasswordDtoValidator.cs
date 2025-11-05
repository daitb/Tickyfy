using FluentValidation;
using Tickify.DTOs.Auth;

namespace Tickify.Validators.Auth;

/// <summary>
/// Validator cho ForgotPasswordDto
/// Kiểm tra: Email
/// </summary>
public class ForgotPasswordDtoValidator : AbstractValidator<ForgotPasswordDto>
{
    public ForgotPasswordDtoValidator()
    {
        // Email validation
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc")
            .EmailAddress().WithMessage("Email không đúng định dạng");
    }
}
