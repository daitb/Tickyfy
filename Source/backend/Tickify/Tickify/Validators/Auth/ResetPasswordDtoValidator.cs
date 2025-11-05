using FluentValidation;
using Tickify.DTOs.Auth;

namespace Tickify.Validators.Auth;

/// <summary>
/// Validator cho ResetPasswordDto
/// Kiểm tra: Token, Password, ConfirmPassword
/// </summary>
public class ResetPasswordDtoValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordDtoValidator()
    {
        // Email validation
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc")
            .EmailAddress().WithMessage("Email không đúng định dạng");

        // Token validation
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Token là bắt buộc");

        // New password validation
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới là bắt buộc")
            .MinimumLength(8).WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ hoa")
            .Matches(@"[a-z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ thường")
            .Matches(@"[0-9]").WithMessage("Mật khẩu mới phải có ít nhất 1 số")
            .Matches(@"[!@#$%^&*(),.?""':{}|<>]").WithMessage("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt");

        // Confirm password validation
        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Xác nhận mật khẩu là bắt buộc")
            .Equal(x => x.NewPassword).WithMessage("Xác nhận mật khẩu không khớp");
    }
}
