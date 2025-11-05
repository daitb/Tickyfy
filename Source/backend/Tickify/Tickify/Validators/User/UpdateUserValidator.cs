using FluentValidation;
using Tickify.DTOs.User;

namespace Tickify.Validators.User;

/// <summary>
/// Validator cho UpdateUserDto
/// Kiểm tra: FullName, Phone, Avatar URL
/// </summary>
public class UpdateUserValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserValidator()
    {
        // FullName validation
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên là bắt buộc")
            .MinimumLength(2).WithMessage("Họ tên phải có ít nhất 2 ký tự")
            .MaximumLength(100).WithMessage("Họ tên không được dài quá 100 ký tự")
            .When(x => !string.IsNullOrEmpty(x.FullName));

        // PhoneNumber validation (optional)
        RuleFor(x => x.PhoneNumber)
            .Matches(@"^(0|\+84)[0-9]{9}$").WithMessage("Số điện thoại không đúng định dạng")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
    }
}
