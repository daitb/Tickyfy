using Xunit;
using FluentAssertions;
using Tickify.Models;

namespace Tickify.Tests.Models;

public class ReviewModelTests
{
    [Fact]
    public void Review_ShouldHaveCorrectProperties()
    {
        // Arrange & Act
        var review = new Review
        {
            Id = 1,
            EventId = 10,
            UserId = 123,
            Rating = 5,
            Comment = "Excellent event!",
            CreatedAt = DateTime.UtcNow
        };

        // Assert
        review.Id.Should().Be(1);
        review.EventId.Should().Be(10);
        review.UserId.Should().Be(123);
        review.Rating.Should().Be(5);
        review.Comment.Should().Be("Excellent event!");
        review.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void Review_Rating_ShouldBeInRange(int rating)
    {
        // Arrange & Act
        var review = new Review { Rating = rating };

        // Assert
        review.Rating.Should().BeInRange(1, 5);
    }

    [Fact]
    public void Review_Comment_ShouldAcceptLongText()
    {
        // Arrange
        var longComment = new string('a', 1000);
        
        // Act
        var review = new Review { Comment = longComment };

        // Assert
        review.Comment.Should().HaveLength(1000);
        review.Comment.Length.Should().BeLessThanOrEqualTo(1000);
    }

    [Fact]
    public void Review_ShouldLinkToUserAndEvent()
    {
        // Arrange
        var user = new User { Id = 123 };
        var eventEntity = new Event { Id = 10 };
        
        // Act
        var review = new Review
        {
            UserId = user.Id,
            EventId = eventEntity.Id,
            User = user,
            Event = eventEntity
        };

        // Assert
        review.UserId.Should().Be(123);
        review.EventId.Should().Be(10);
        review.User.Should().NotBeNull();
        review.Event.Should().NotBeNull();
    }

    [Fact]
    public void Review_CreatedAt_ShouldBeRecent()
    {
        // Arrange & Act
        var review = new Review
        {
            CreatedAt = DateTime.UtcNow
        };

        // Assert
        review.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void Review_UpdatedAt_ShouldBeAfterCreatedAt()
    {
        // Arrange & Act
        var now = DateTime.UtcNow;
        var review = new Review
        {
            CreatedAt = now,
            UpdatedAt = now.AddHours(1)
        };

        // Assert
        review.UpdatedAt.Should().BeAfter(review.CreatedAt);
    }

    [Theory]
    [InlineData("Great event!")]
    [InlineData("Could be better")]
    [InlineData("")]
    public void Review_Comment_ShouldAcceptVariousText(string comment)
    {
        // Arrange & Act
        var review = new Review { Comment = comment };

        // Assert
        review.Comment.Should().Be(comment);
    }
}
