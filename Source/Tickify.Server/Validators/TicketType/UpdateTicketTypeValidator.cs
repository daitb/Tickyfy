using FluentValidation;
using Tickify.DTOs.TicketType;

namespace Tickify.Server.Validators.TicketType
{
    public class UpdateTicketTypeValidator : AbstractValidator<UpdateTicketTypeDto>
    {
        public UpdateTicketTypeValidator()
        {
            RuleFor(x => x.TypeName)
                .NotEmpty().WithMessage("TypeName is required.")
                .MaximumLength(100);

            RuleFor(x => x.Price)
                .GreaterThanOrEqualTo(0).WithMessage("Price must be non-negative.");

            RuleFor(x => x.Quantity)
                .GreaterThanOrEqualTo(0).WithMessage("Quantity must be non-negative.");
        }
    }
}
