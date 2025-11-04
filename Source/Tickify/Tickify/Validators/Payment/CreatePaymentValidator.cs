using FluentValidation;
using Tickify.DTOs.Payment;

namespace Tickify.Validators.Payment
{
    public class CreatePaymentValidator : AbstractValidator<CreatePaymentDto>
    {
        public CreatePaymentValidator()
        {
            RuleFor(x => x.BookingId)
                .NotEmpty().WithMessage("BookingId is required");

            RuleFor(x => x.PaymentMethod)
                .NotEmpty().WithMessage("Payment method is required")
                .Must(method => method == "payos" || method == "vnpay")
                .WithMessage("Payment method must be 'payos' or 'vnpay'");

            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Amount must be greater than 0");

            RuleFor(x => x.ReturnUrl)
                .NotEmpty().WithMessage("Return URL is required")
                .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
                .When(x => !string.IsNullOrEmpty(x.ReturnUrl))
                .WithMessage("Return URL must be a valid URL");

            RuleFor(x => x.CancelUrl)
                .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
                .When(x => !string.IsNullOrEmpty(x.CancelUrl))
                .WithMessage("Cancel URL must be a valid URL");

            // payOS specific validations
            When(x => x.PaymentMethod == "payos", () =>
            {
                RuleFor(x => x.Description)
                    .MaximumLength(255).WithMessage("Description cannot exceed 255 characters");
                
                RuleFor(x => x.BuyerEmail)
                    .EmailAddress().When(x => !string.IsNullOrEmpty(x.BuyerEmail))
                    .WithMessage("Buyer email must be valid");
            });
        }
    }
}