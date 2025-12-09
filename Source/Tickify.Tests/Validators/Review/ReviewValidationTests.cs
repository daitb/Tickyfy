using Xunit;
using FluentAssertions;
using Tickify.Validators.Reviews;
using Tickify.DTOs.Review;

namespace Tickify.Tests.Validators.Review;

public class ReviewValidationTests
{
    private readonly CreateReviewValidator _validator;

    public ReviewValidationTests()
    {
        _validator = new CreateReviewValidator();
    }

    [Fact]
    public void CreateReviewValidator_ShouldPass_WhenDataIsValid()
    {
        var dto = new CreateReviewDto
        {
            EventId = 1,
            Rating = 5,
            Comment = "Great event!"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public void CreateReviewValidator_ShouldFail_WhenRatingIsOutOfRange(int rating)
    {
        var dto = new CreateReviewDto
        {
            EventId = 1,
            Rating = rating,
            Comment = "Test"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Rating");
    }

    [Fact]
    public void CreateReviewValidator_ShouldFail_WhenEventIdIsZero()
    {
        var dto = new CreateReviewDto
        {
            EventId = 0,
            Rating = 5,
            Comment = "Test"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "EventId");
    }

    [Fact]
    public void CreateReviewValidator_ShouldFail_WhenCommentIsTooLong()
    {
        var dto = new CreateReviewDto
        {
            EventId = 1,
            Rating = 5,
            Comment = new string('a', 1001) // 1001 characters
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Comment");
    }

    [Fact]
    public void UpdateReviewValidator_ShouldPass_WhenDataIsValid()
    {
        var validator = new UpdateReviewValidator();
        var dto = new UpdateReviewDto
        {
            Rating = 4,
            Comment = "Updated review"
        };

        var result = validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }
}
