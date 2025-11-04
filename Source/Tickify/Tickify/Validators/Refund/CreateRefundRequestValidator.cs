using FluentValidation;
using Tickify.DTOs.Refund;

namespace Tickify.Validators.Refund
{
    public class CreateRefundRequestValidator : AbstractValidator<CreateRefundRequestDto>
    {
        public CreateRefundRequestValidator()
        {
            RuleFor(x => x.BookingId)
                .NotEmpty().WithMessage("BookingId is required");

            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("Reason is required")
                .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters");

            RuleFor(x => x.AdditionalNotes)
                .MaximumLength(1000).WithMessage("Additional notes cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.AdditionalNotes));

            RuleFor(x => x.RefundAmount)
                .GreaterThan(0).WithMessage("Refund amount must be greater than 0");

            RuleFor(x => x.RefundMethod)
                .NotEmpty().WithMessage("Refund method is required")
                .Must(method => new[] { "original", "bank_transfer", "wallet" }.Contains(method))
                .WithMessage("Refund method must be one of: original, bank_transfer, wallet");

            When(x => x.RefundMethod == "bank_transfer", () =>
            {
                RuleFor(x => x.RefundAmount)
                    .GreaterThanOrEqualTo(50000).WithMessage("Bank transfer refunds require minimum 50,000 VND");
            });
        }
    }
}