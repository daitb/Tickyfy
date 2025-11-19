using FluentValidation;
using Tickify.DTOs.Organizer;

namespace Tickify.Validators.Organizer;

/// <summary>
/// Validator cho CreateOrganizerDto
/// Kiểm tra: CompanyName, Email, Phone
/// </summary>
public class CreateOrganizerValidator : AbstractValidator<CreateOrganizerDto>
{
    public CreateOrganizerValidator()
    {
        // CompanyName validation
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Tên công ty là bắt buộc")
            .MinimumLength(2).WithMessage("Tên công ty phải có ít nhất 2 ký tự")
            .MaximumLength(200).WithMessage("Tên công ty không được dài quá 200 ký tự");

        // CompanyPhone validation (optional)
        RuleFor(x => x.CompanyPhone)
            .Matches(@"^(0|\+84)[0-9]{9}$").WithMessage("Số điện thoại công ty không đúng định dạng")
            .When(x => !string.IsNullOrEmpty(x.CompanyPhone));

        // Website validation (optional)
        RuleFor(x => x.Website)
            .Must(BeAValidUrl).WithMessage("Website phải là một URL hợp lệ")
            .When(x => !string.IsNullOrEmpty(x.Website));

        // Description validation (optional)
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Mô tả không được dài quá 1000 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url))
            return true;

        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}
