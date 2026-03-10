using FluentValidation;
using Tickify.DTOs.Organizer;

namespace Tickify.Validators.Organizer;

public class CreateOrganizerValidator : AbstractValidator<CreateOrganizerDto>
{
    public CreateOrganizerValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Tên công ty là bắt buộc")
            .MinimumLength(3).WithMessage("Tên công ty phải có ít nhất 3 ký tự")
            .MaximumLength(200).WithMessage("Tên công ty không được vượt quá 200 ký tự")
            .Matches(@"^[a-zA-ZÀ-ỹ0-9\s\.,\-&()]+$").WithMessage("Tên công ty chứa ký tự không hợp lệ");

        RuleFor(x => x.CompanyPhone)
            .NotEmpty().WithMessage("Số điện thoại là bắt buộc")
            .Must(BeAValidVietnamesePhone).WithMessage("Số điện thoại không hợp lệ. VD: 0901234567 hoặc +84901234567")
            .When(x => !string.IsNullOrEmpty(x.CompanyPhone));

        RuleFor(x => x.CompanyEmail)
            .EmailAddress().WithMessage("Email không hợp lệ. VD: contact@company.com")
            .MaximumLength(100).WithMessage("Email không được vượt quá 100 ký tự")
            .When(x => !string.IsNullOrEmpty(x.CompanyEmail));

        RuleFor(x => x.CompanyAddress)
            .NotEmpty().WithMessage("Địa chỉ công ty là bắt buộc")
            .MinimumLength(10).WithMessage("Địa chỉ phải có ít nhất 5 ký tự")
            .MaximumLength(500).WithMessage("Địa chỉ không được vượt quá 500 ký tự")
            .When(x => !string.IsNullOrEmpty(x.CompanyAddress));

        RuleFor(x => x.TaxCode)
            .Matches(@"^[0-9]{10}(-[0-9]{3})?$").WithMessage("Mã số thuế không hợp lệ. VD: 0123456789 hoặc 0123456789-001")
            .When(x => !string.IsNullOrEmpty(x.TaxCode));

        RuleFor(x => x.BusinessRegistrationNumber)
            .Matches(@"^[0-9]{10,13}$").WithMessage("Số đăng ký kinh doanh phải có 10-13 chữ số")
            .When(x => !string.IsNullOrEmpty(x.BusinessRegistrationNumber));

        RuleFor(x => x.Website)
            .Must(BeAValidUrl).WithMessage("Website phải là URL hợp lệ. VD: https://www.company.com")
            .MaximumLength(200).WithMessage("Website không được vượt quá 200 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Website));

        RuleFor(x => x.Description)
            .MinimumLength(20).WithMessage("Mô tả phải có ít nhất 20 ký tự")
            .MaximumLength(2000).WithMessage("Mô tả không được vượt quá 2000 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }

    private bool BeAValidVietnamesePhone(string? phone)
    {
        if (string.IsNullOrEmpty(phone))
            return false;

        var cleanPhone = phone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
        
        return System.Text.RegularExpressions.Regex.IsMatch(cleanPhone, @"^(\+84|84|0)(3|5|7|8|9)\d{8}$");
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url))
            return true;

        if (!url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && 
            !url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return false;

        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}
