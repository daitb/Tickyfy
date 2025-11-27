using FluentValidation;
using Tickify.DTOs.Wishlist;

namespace Tickify.Validators.Wishlist;

/// <summary>
/// Validator for adding events to wishlist.
/// Ensures EventId is valid and positive.
/// </summary>
public class AddToWishlistValidator : AbstractValidator<AddToWishlistDto>
{
    public AddToWishlistValidator()
    {
        RuleFor(x => x.EventId)
            .GreaterThan(0)
            .WithMessage("Event ID must be greater than 0");
    }
}
