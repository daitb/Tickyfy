using Xunit;
using FluentAssertions;
using Tickify.Validators.Waitlist;
using Tickify.DTOs.Waitlist;

namespace Tickify.Tests.Validators.Waitlist;

public class WaitlistValidationTests
{
    private readonly JoinWaitlistValidator _validator;

    public WaitlistValidationTests()
    {
        _validator = new JoinWaitlistValidator();
    }

    [Fact]
    public void JoinWaitlistValidator_ShouldPass_WhenDataIsValid()
    {
        var dto = new JoinWaitlistDto
        {
            EventId = 1
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void JoinWaitlistValidator_ShouldFail_WhenEventIdIsInvalid(int eventId)
    {
        var dto = new JoinWaitlistDto
        {
            EventId = eventId
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "EventId");
    }

    [Fact]
    public void JoinWaitlistValidator_ShouldPass_WhenEventIdIsPositive()
    {
        var dto = new JoinWaitlistDto
        {
            EventId = 999
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }
}
