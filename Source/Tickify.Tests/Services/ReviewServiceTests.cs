using FluentAssertions;
using Moq;
using System.Security.Claims;
using Tickify.DTOs.Review;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
using Tickify.Services.Reviews;
using Xunit;

namespace Tickify.Tests.Services;

/// <summary>
/// Unit tests cho ReviewService
/// </summary>
public class ReviewServiceTests
{
    private readonly Mock<IReviewRepository> _mockReviewRepository;
    private readonly Mock<ITicketRepository> _mockTicketRepository;
    private readonly Mock<ITicketScanRepository> _mockTicketScanRepository;
    private readonly ReviewService _reviewService;

    public ReviewServiceTests()
    {
        _mockReviewRepository = new Mock<IReviewRepository>();
        _mockTicketRepository = new Mock<ITicketRepository>();
        _mockTicketScanRepository = new Mock<ITicketScanRepository>();

        _reviewService = new ReviewService(
            _mockReviewRepository.Object,
            _mockTicketRepository.Object,
            _mockTicketScanRepository.Object
        );
    }

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldCreateReview()
    {
        // Arrange
        var userId = 1;
        var eventId = 1;
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("userId", userId.ToString())
        }));

        var createDto = new CreateReviewDto
        {
            EventId = eventId,
            Rating = 5,
            Comment = "Great event!"
        };

        var existingReviews = new List<Review>();
        _mockReviewRepository
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(existingReviews);

        var createdReview = new Review
        {
            Id = 1,
            EventId = eventId,
            UserId = userId,
            Rating = 5,
            Comment = "Great event!",
            CreatedAt = DateTime.UtcNow
        };

        _mockReviewRepository
            .Setup(r => r.CreateAsync(It.IsAny<Review>()))
            .ReturnsAsync(createdReview);

        // Act
        var result = await _reviewService.CreateAsync(createDto, claims);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        result.Rating.Should().Be(5);
        result.Comment.Should().Be("Great event!");
        _mockReviewRepository.Verify(r => r.CreateAsync(It.Is<Review>(r =>
            r.EventId == eventId &&
            r.UserId == userId &&
            r.Rating == 5 &&
            r.Comment == "Great event!"
        )), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithExistingReview_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userId = 1;
        var eventId = 1;
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("userId", userId.ToString())
        }));

        var createDto = new CreateReviewDto
        {
            EventId = eventId,
            Rating = 5,
            Comment = "Great event!"
        };

        var existingReview = new Review
        {
            Id = 1,
            EventId = eventId,
            UserId = userId,
            Rating = 4,
            Comment = "Previous review"
        };

        var existingReviews = new List<Review> { existingReview };
        _mockReviewRepository
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(existingReviews);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _reviewService.CreateAsync(createDto, claims));
    }

    [Fact]
    public async Task CreateAsync_WithInvalidRating_ShouldCreateReview()
    {
        // Arrange
        var userId = 1;
        var eventId = 1;
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("userId", userId.ToString())
        }));

        var createDto = new CreateReviewDto
        {
            EventId = eventId,
            Rating = 3,
            Comment = "Average event"
        };

        var existingReviews = new List<Review>();
        _mockReviewRepository
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(existingReviews);

        var createdReview = new Review
        {
            Id = 1,
            EventId = eventId,
            UserId = userId,
            Rating = 3,
            Comment = "Average event"
        };

        _mockReviewRepository
            .Setup(r => r.CreateAsync(It.IsAny<Review>()))
            .ReturnsAsync(createdReview);

        // Act
        var result = await _reviewService.CreateAsync(createDto, claims);

        // Assert
        result.Should().NotBeNull();
        result.Rating.Should().Be(3);
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnReview()
    {
        // Arrange
        var reviewId = 1;
        var review = new Review
        {
            Id = reviewId,
            EventId = 1,
            UserId = 1,
            Rating = 5,
            Comment = "Great event!"
        };

        _mockReviewRepository
            .Setup(r => r.GetByIdAsync(reviewId))
            .ReturnsAsync(review);

        // Act
        var result = await _reviewService.GetByIdAsync(reviewId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(reviewId);
        _mockReviewRepository.Verify(r => r.GetByIdAsync(reviewId), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var reviewId = 999;
        _mockReviewRepository
            .Setup(r => r.GetByIdAsync(reviewId))
            .ReturnsAsync((Review?)null);

        // Act
        var result = await _reviewService.GetByIdAsync(reviewId);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region GetByEventAsync Tests

    [Fact]
    public async Task GetByEventAsync_ShouldReturnReviewsForEvent()
    {
        // Arrange
        var eventId = 1;
        var reviews = new List<Review>
        {
            new Review { Id = 1, EventId = eventId, UserId = 1, Rating = 5, Comment = "Great!" },
            new Review { Id = 2, EventId = eventId, UserId = 2, Rating = 4, Comment = "Good!" }
        };

        _mockReviewRepository
            .Setup(r => r.GetByEventIdAsync(eventId))
            .ReturnsAsync(reviews);

        // Act
        var result = await _reviewService.GetByEventAsync(eventId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        _mockReviewRepository.Verify(r => r.GetByEventIdAsync(eventId), Times.Once);
    }

    #endregion

    #region GetMineAsync Tests

    [Fact]
    public async Task GetMineAsync_ShouldReturnUserReviews()
    {
        // Arrange
        var userId = 1;
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("userId", userId.ToString())
        }));

        var reviews = new List<Review>
        {
            new Review { Id = 1, EventId = 1, UserId = userId, Rating = 5 },
            new Review { Id = 2, EventId = 2, UserId = userId, Rating = 4 }
        };

        _mockReviewRepository
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(reviews);

        // Act
        var result = await _reviewService.GetMineAsync(claims);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        _mockReviewRepository.Verify(r => r.GetByUserIdAsync(userId), Times.Once);
    }

    #endregion

    #region UpdateMineAsync Tests

    [Fact]
    public async Task UpdateMineAsync_WithValidData_ShouldUpdateReview()
    {
        // Arrange
        var userId = 1;
        var reviewId = 1;
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("userId", userId.ToString())
        }));

        var existingReview = new Review
        {
            Id = reviewId,
            EventId = 1,
            UserId = userId,
            Rating = 4,
            Comment = "Old comment"
        };

        var updateDto = new UpdateReviewDto
        {
            Rating = 5,
            Comment = "Updated comment"
        };

        var userReviews = new List<Review> { existingReview };
        _mockReviewRepository
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(userReviews);

        var updatedReview = new Review
        {
            Id = reviewId,
            EventId = 1,
            UserId = userId,
            Rating = 5,
            Comment = "Updated comment"
        };

        _mockReviewRepository
            .Setup(r => r.UpdateAsync(It.IsAny<Review>()))
            .ReturnsAsync(updatedReview);

        // Act
        var result = await _reviewService.UpdateMineAsync(reviewId, updateDto, claims);

        // Assert
        result.Should().NotBeNull();
        result.Rating.Should().Be(5);
        result.Comment.Should().Be("Updated comment");
        _mockReviewRepository.Verify(r => r.UpdateAsync(It.Is<Review>(r =>
            r.Id == reviewId &&
            r.Rating == 5 &&
            r.Comment == "Updated comment"
        )), Times.Once);
    }

    [Fact]
    public async Task UpdateMineAsync_WithNonExistentReview_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userId = 1;
        var reviewId = 999;
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("userId", userId.ToString())
        }));

        var updateDto = new UpdateReviewDto
        {
            Rating = 5,
            Comment = "Updated comment"
        };

        var userReviews = new List<Review>(); // Empty list - review not found
        _mockReviewRepository
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(userReviews);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _reviewService.UpdateMineAsync(reviewId, updateDto, claims));
    }

    #endregion

    #region DeleteMineAsync Tests

    [Fact]
    public async Task DeleteMineAsync_WithValidReview_ShouldDeleteReview()
    {
        // Arrange
        var userId = 1;
        var reviewId = 1;
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("userId", userId.ToString())
        }));

        var existingReview = new Review
        {
            Id = reviewId,
            EventId = 1,
            UserId = userId,
            Rating = 5,
            Comment = "Great event!"
        };

        var userReviews = new List<Review> { existingReview };
        _mockReviewRepository
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(userReviews);

        _mockReviewRepository
            .Setup(r => r.DeleteAsync(reviewId, userId, false))
            .ReturnsAsync(true);

        // Act
        var result = await _reviewService.DeleteMineAsync(reviewId, claims);

        // Assert
        result.Should().BeTrue();
        _mockReviewRepository.Verify(r => r.DeleteAsync(reviewId, userId, false), Times.Once);
    }

    [Fact]
    public async Task DeleteMineAsync_WithNonExistentReview_ShouldReturnFalse()
    {
        // Arrange
        var userId = 1;
        var reviewId = 999;
        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("userId", userId.ToString())
        }));

        // Mock DeleteAsync to return false (review not found or not owned by user)
        _mockReviewRepository
            .Setup(r => r.DeleteAsync(reviewId, userId, false))
            .ReturnsAsync(false);

        // Act
        var result = await _reviewService.DeleteMineAsync(reviewId, claims);

        // Assert
        result.Should().BeFalse();
        _mockReviewRepository.Verify(r => r.DeleteAsync(reviewId, userId, false), Times.Once);
    }

    #endregion
}

