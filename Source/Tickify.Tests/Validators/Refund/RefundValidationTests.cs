using Xunit;
using FluentAssertions;
using Tickify.Validators.Refund;
using Tickify.DTOs.Refund;

namespace Tickify.Tests.Validators.Refund;

public class RefundValidationTests
{
    private readonly CreateRefundRequestValidator _validator;

    public RefundValidationTests()
    {
        _validator = new CreateRefundRequestValidator();
    }

    [Fact]
    public void CreateRefundRequestValidator_ShouldPass_WhenDataIsValid()
    {
        var dto = new CreateRefundRequestDto
        {
            BookingId = 1,
            RefundAmount = 100.00m,
            Reason = "Event was cancelled"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateRefundRequestValidator_ShouldFail_WhenBookingIdIsZero()
    {
        var dto = new CreateRefundRequestDto
        {
            BookingId = 0,
            RefundAmount = 100,
            Reason = "Test reason"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BookingId");
    }

    [Fact]
    public void CreateRefundRequestValidator_ShouldFail_WhenRefundAmountIsZero()
    {
        var dto = new CreateRefundRequestDto
        {
            BookingId = 1,
            RefundAmount = 0,
            Reason = "Valid reason"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "RefundAmount");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateRefundRequestValidator_ShouldFail_WhenReasonIsEmpty(string reason)
    {
        var dto = new CreateRefundRequestDto
        {
            BookingId = 1,
            RefundAmount = 100,
            Reason = reason
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }

    [Fact]
    public void CreateRefundRequestValidator_ShouldFail_WhenReasonIsTooLong()
    {
        var dto = new CreateRefundRequestDto
        {
            BookingId = 1,
            RefundAmount = 100,
            Reason = new string('a', 501) // 501 characters, max is 500
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }
}
