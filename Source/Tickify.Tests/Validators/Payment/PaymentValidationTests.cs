using Xunit;
using FluentAssertions;
using Tickify.Validators.Payment;
using Tickify.DTOs.Payment;

namespace Tickify.Tests.Validators.Payment;

public class PaymentValidationTests
{
    private readonly CreatePaymentDtoValidator _validator;

    public PaymentValidationTests()
    {
        _validator = new CreatePaymentDtoValidator();
    }

    [Fact]
    public void CreatePaymentDtoValidator_ShouldPass_WhenDataIsValid()
    {
        var dto = new CreatePaymentDto
        {
            BookingId = 1,
            Provider = "VNPay"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreatePaymentDtoValidator_ShouldFail_WhenBookingIdIsZero()
    {
        var dto = new CreatePaymentDto
        {
            BookingId = 0,
            Provider = "VNPay"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BookingId");
    }

    [Theory]
    [InlineData("InvalidProvider")]
    [InlineData("")]
    public void CreatePaymentDtoValidator_ShouldFail_WhenProviderIsInvalid(string provider)
    {
        var dto = new CreatePaymentDto
        {
            BookingId = 1,
            Provider = provider
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }
}
