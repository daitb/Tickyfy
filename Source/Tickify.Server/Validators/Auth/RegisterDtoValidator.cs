using FluentValidation;
using Tickify.DTOs.Auth;

namespace Tickify.Validators.Auth;

/// <summary>
/// Validator cho RegisterDto
/// Kiểm tra: Email, Password, FullName, Phone
/// </summary>
public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        // Email validation
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email là bắt buộc")
            .EmailAddress().WithMessage("Email không đúng định dạng")
            .MaximumLength(100).WithMessage("Email không được dài quá 100 ký tự");

        // Password validation
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu là bắt buộc")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu phải có ít nhất 1 chữ hoa")
            .Matches(@"[a-z]").WithMessage("Mật khẩu phải có ít nhất 1 chữ thường")
            .Matches(@"[0-9]").WithMessage("Mật khẩu phải có ít nhất 1 số")
            .Matches(@"[!@#$%^&*(),.?""':{}|<>]").WithMessage("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");

        // FullName validation
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên là bắt buộc")
            .MinimumLength(2).WithMessage("Họ tên phải có ít nhất 2 ký tự")
            .MaximumLength(100).WithMessage("Họ tên không được dài quá 100 ký tự");

        // ConfirmPassword validation
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Mật khẩu xác nhận không khớp");
    }
}
