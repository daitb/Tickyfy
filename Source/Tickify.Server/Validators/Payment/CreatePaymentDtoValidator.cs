using FluentValidation;
using Tickify.DTOs.Payment;

namespace Tickify.Validators.Payment;

/// <summary>
/// Validator cho CreatePaymentDto
/// Kiểm tra: BookingId, Provider
/// </summary>
public class CreatePaymentDtoValidator : AbstractValidator<CreatePaymentDto>
{
    private static readonly string[] ValidProviders = { "VNPay", "MoMo", "momo", "vnpay" };

    public CreatePaymentDtoValidator()
    {
        // BookingId validation
        RuleFor(x => x.BookingId)
            .GreaterThan(0)
            .WithMessage("BookingId phải lớn hơn 0")
            .WithName("Booking ID");

        // Provider validation
        RuleFor(x => x.Provider)
            .NotEmpty()
            .WithMessage("Phương thức thanh toán là bắt buộc")
            .Must(BeValidProvider)
            .WithMessage($"Phương thức thanh toán phải là một trong các giá trị: {string.Join(", ", ValidProviders.Distinct())}")
            .WithName("Payment Provider");
    }

    private bool BeValidProvider(string? provider)
    {
        if (string.IsNullOrWhiteSpace(provider))
            return false;

        return ValidProviders.Any(p => 
            p.Equals(provider, StringComparison.OrdinalIgnoreCase));
    }
}

