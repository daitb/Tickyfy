using Xunit;
using FluentAssertions;
using Tickify.Validators.Wishlist;
using Tickify.DTOs.Wishlist;

namespace Tickify.Tests.Validators.Wishlist;

public class WishlistValidationTests
{
    private readonly AddToWishlistValidator _validator;

    public WishlistValidationTests()
    {
        _validator = new AddToWishlistValidator();
    }

    [Fact]
    public void AddToWishlistValidator_ShouldPass_WhenDataIsValid()
    {
        var dto = new AddToWishlistDto
        {
            EventId = 1
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public void AddToWishlistValidator_ShouldFail_WhenEventIdIsInvalid(int eventId)
    {
        var dto = new AddToWishlistDto
        {
            EventId = eventId
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "EventId");
    }

    [Fact]
    public void AddToWishlistValidator_ShouldPass_WhenEventIdIsLarge()
    {
        var dto = new AddToWishlistDto
        {
            EventId = 999999
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }
}
