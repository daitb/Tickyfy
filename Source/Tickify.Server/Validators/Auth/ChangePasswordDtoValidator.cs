using FluentValidation;
using Tickify.DTOs.Auth;

namespace Tickify.Validators.Auth;

public class ChangePasswordDtoValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordDtoValidator()
    {
        // Current password validation
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Mật khẩu hiện tại là bắt buộc");

        // New password validation
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới là bắt buộc")
            .MinimumLength(8).WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ hoa")
            .Matches(@"[a-z]").WithMessage("Mật khẩu mới phải có ít nhất 1 chữ thường")
            .Matches(@"[0-9]").WithMessage("Mật khẩu mới phải có ít nhất 1 số")
            .Matches(@"[!@#$%^&*(),.?""':{}|<>]").WithMessage("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt")
            .NotEqual(x => x.CurrentPassword).WithMessage("Mật khẩu mới phải khác mật khẩu hiện tại");

        // Confirm password validation
        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Xác nhận mật khẩu là bắt buộc")
            .Equal(x => x.NewPassword).WithMessage("Xác nhận mật khẩu không khớp");
    }
}
