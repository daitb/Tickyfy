using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Tickify.Common;
using Tickify.Controllers;
using Tickify.DTOs.Event;
using Tickify.Interfaces.Services;
using Xunit;

namespace Tickify.Tests.Controllers;

/// <summary>
/// Unit tests cho EventController
/// </summary>
public class EventControllerTests
{
    private readonly Mock<IEventService> _mockEventService;
    private readonly Mock<ILogger<EventController>> _mockLogger;
    private readonly EventController _controller;

    public EventControllerTests()
    {
        _mockEventService = new Mock<IEventService>();
        _mockLogger = new Mock<ILogger<EventController>>();
        _controller = new EventController(
            _mockEventService.Object,
            _mockLogger.Object,
            null! // ApplicationDbContext không cần thiết cho controller tests
        );
    }

    #region GetEvents Tests

    [Fact]
    public async Task GetEvents_ShouldReturnOkWithPagedResults()
    {
        // Arrange
        var filter = new EventFilterDto
        {
            PageNumber = 1,
            PageSize = 10
        };

        var events = new List<EventListDto>
        {
            new EventListDto { EventId = 1, Title = "Event 1" },
            new EventListDto { EventId = 2, Title = "Event 2" }
        };

        var pagedResult = new PagedResult<EventListDto>(
            events,
            totalCount: 2,
            pageNumber: 1,
            pageSize: 10
        );

        _mockEventService
            .Setup(s => s.GetAllEventsAsync(filter))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.GetEvents(filter);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        
        var response = okResult!.Value as ApiResponse<PagedResult<EventListDto>>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
        response.Data.Should().NotBeNull();
        response.Data!.Items.Should().HaveCount(2);
    }

    #endregion

    #region GetEventById Tests

    [Fact]
    public async Task GetEventById_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var eventId = 1;
        var eventDetail = new EventDetailDto
        {
            EventId = eventId,
            Title = "Test Event",
            Description = "Test Description"
        };

        _mockEventService
            .Setup(s => s.GetEventByIdAsync(eventId))
            .ReturnsAsync(eventDetail);

        // Act
        var result = await _controller.GetEventById(eventId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<EventDetailDto>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
        response.Data!.EventId.Should().Be(eventId);
    }

    [Fact]
    public async Task GetEventById_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var eventId = 999;
        _mockEventService
            .Setup(s => s.GetEventByIdAsync(eventId))
            .ReturnsAsync((EventDetailDto?)null);

        // Act
        var result = await _controller.GetEventById(eventId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
        var notFoundResult = result.Result as NotFoundObjectResult;
        var response = notFoundResult!.Value as ApiResponse<EventDetailDto>;
        response.Should().NotBeNull();
        response!.Success.Should().BeFalse();
    }

    #endregion

    #region GetFeaturedEvents Tests

    [Fact]
    public async Task GetFeaturedEvents_ShouldReturnOkWithEvents()
    {
        // Arrange
        var count = 5;
        var events = new List<EventCardDto>
        {
            new EventCardDto { EventId = 1, Title = "Featured 1" },
            new EventCardDto { EventId = 2, Title = "Featured 2" }
        };

        _mockEventService
            .Setup(s => s.GetFeaturedEventsAsync(count))
            .ReturnsAsync(events);

        // Act
        var result = await _controller.GetFeaturedEvents(count);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<List<EventCardDto>>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetFeaturedEvents_WithCountGreaterThan50_ShouldLimitTo50()
    {
        // Arrange
        var count = 100;
        var events = new List<EventCardDto>();

        _mockEventService
            .Setup(s => s.GetFeaturedEventsAsync(50)) // Should be limited to 50
            .ReturnsAsync(events);

        // Act
        await _controller.GetFeaturedEvents(count);

        // Assert
        _mockEventService.Verify(s => s.GetFeaturedEventsAsync(50), Times.Once);
    }

    #endregion

    #region GetUpcomingEvents Tests

    [Fact]
    public async Task GetUpcomingEvents_ShouldReturnOkWithEvents()
    {
        // Arrange
        var count = 10;
        var events = new List<EventCardDto>
        {
            new EventCardDto { EventId = 1, Title = "Upcoming 1" }
        };

        _mockEventService
            .Setup(s => s.GetUpcomingEventsAsync(count))
            .ReturnsAsync(events);

        // Act
        var result = await _controller.GetUpcomingEvents(count);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<List<EventCardDto>>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
    }

    #endregion

    #region SearchEvents Tests

    [Fact]
    public async Task SearchEvents_WithValidQuery_ShouldReturnOk()
    {
        // Arrange
        var query = "concert";
        var events = new List<EventListDto>
        {
            new EventListDto { EventId = 1, Title = "Concert Event" }
        };

        var pagedResult = new PagedResult<EventListDto>(
            events,
            totalCount: 1,
            pageNumber: 1,
            pageSize: 20
        );

        _mockEventService
            .Setup(s => s.SearchEventsAsync(query, 1, 20))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _controller.SearchEvents(query, 1, 20);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<PagedResult<EventListDto>>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task SearchEvents_WithEmptyQuery_ShouldReturnBadRequest()
    {
        // Act
        var result = await _controller.SearchEvents("", 1, 20);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result.Result as BadRequestObjectResult;
        var response = badRequestResult!.Value as ApiResponse<PagedResult<EventListDto>>;
        response.Should().NotBeNull();
        response!.Success.Should().BeFalse();
    }

    [Fact]
    public async Task SearchEvents_WithPageSizeGreaterThan100_ShouldLimitTo100()
    {
        // Arrange
        var query = "test";
        var events = new List<EventListDto>();
        var pagedResult = new PagedResult<EventListDto>(
            events,
            totalCount: 0,
            pageNumber: 1,
            pageSize: 100
        );

        _mockEventService
            .Setup(s => s.SearchEventsAsync(query, 1, 100)) // Should be limited to 100
            .ReturnsAsync(pagedResult);

        // Act
        await _controller.SearchEvents(query, 1, 200);

        // Assert
        _mockEventService.Verify(s => s.SearchEventsAsync(query, 1, 100), Times.Once);
    }

    #endregion
}

