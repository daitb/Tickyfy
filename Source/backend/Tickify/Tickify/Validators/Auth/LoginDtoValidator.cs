using FluentValidation;
using Tickify.DTOs.Auth;

namespace Tickify.Validators.Auth;

/// <summary>
/// Validator cho LoginDto
/// Kiểm tra: Email và Password không được rỗng
/// </summary>
public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        // Email validation
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc")
            .EmailAddress().WithMessage("Email không đúng định dạng");

        // Password validation
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu là bắt buộc")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự");
    }
}
