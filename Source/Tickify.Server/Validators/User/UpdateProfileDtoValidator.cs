using FluentValidation;
using Tickify.DTOs.User;

namespace Tickify.Validators.User;

public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
{
    public UpdateProfileDtoValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên không được để trống")
            .MaximumLength(100).WithMessage("Họ tên không được vượt quá 100 ký tự");

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^(\+84|0)[0-9]{9,10}$").WithMessage("Số điện thoại không hợp lệ")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.DateOfBirth)
            .LessThan(DateTime.Now).WithMessage("Ngày sinh phải là ngày trong quá khứ")
            .GreaterThan(DateTime.Now.AddYears(-120)).WithMessage("Ngày sinh không hợp lệ")
            .When(x => x.DateOfBirth.HasValue);
    }
}
