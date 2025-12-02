using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Tickify.Common;
using Tickify.Data;
using Tickify.DTOs.Event;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Services;
using Tickify.Services.Email;
using Tickify.Tests.Helpers;
using Xunit;

namespace Tickify.Tests.Services;

/// <summary>
/// Unit tests cho EventService
/// </summary>
public class EventServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IEventRepository> _mockRepository;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ILogger<EventService>> _mockLogger;
    private readonly EventService _eventService;

    public EventServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _mockRepository = new Mock<IEventRepository>();
        _mockEmailService = new Mock<IEmailService>();
        _mockNotificationService = new Mock<INotificationService>();
        _mockLogger = new Mock<ILogger<EventService>>();

        _eventService = new EventService(
            _mockRepository.Object,
            _context,
            _mockEmailService.Object,
            _mockNotificationService.Object,
            _mockLogger.Object
        );
    }

    #region GetAllEventsAsync Tests

    [Fact]
    public async Task GetAllEventsAsync_ShouldReturnPagedResult()
    {
        // Arrange
        var filter = new EventFilterDto
        {
            PageNumber = 1,
            PageSize = 10
        };

        var events = new List<Event>
        {
            new Event { Id = 1, Title = "Event 1", Status = EventStatus.Published },
            new Event { Id = 2, Title = "Event 2", Status = EventStatus.Published }
        };

        var pagedResult = new PagedResult<Event>(
            events,
            totalCount: 2,
            pageNumber: 1,
            pageSize: 10
        );

        _mockRepository
            .Setup(r => r.GetAllAsync(It.IsAny<EventFilterDto>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _eventService.GetAllEventsAsync(filter);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);
        _mockRepository.Verify(r => r.GetAllAsync(filter), Times.Once);
    }

    #endregion

    #region GetEventByIdAsync Tests

    [Fact]
    public async Task GetEventByIdAsync_WithValidId_ShouldReturnEventDetail()
    {
        // Arrange
        var eventId = 1;
        var eventEntity = new Event
        {
            Id = eventId,
            Title = "Test Event",
            Description = "Test Description",
            Status = EventStatus.Published,
            OrganizerId = 1,
            CategoryId = 1,
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(8)
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(eventId, true))
            .ReturnsAsync(eventEntity);

        // Act
        var result = await _eventService.GetEventByIdAsync(eventId);

        // Assert
        result.Should().NotBeNull();
        result!.EventId.Should().Be(eventId);
        result.Title.Should().Be("Test Event");
        _mockRepository.Verify(r => r.GetByIdAsync(eventId, true), Times.Once);
    }

    [Fact]
    public async Task GetEventByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var eventId = 999;
        _mockRepository
            .Setup(r => r.GetByIdAsync(eventId, true))
            .ReturnsAsync((Event?)null);

        // Act
        var result = await _eventService.GetEventByIdAsync(eventId);

        // Assert
        result.Should().BeNull();
        _mockRepository.Verify(r => r.GetByIdAsync(eventId, true), Times.Once);
    }

    #endregion

    #region CreateEventAsync Tests

    [Fact]
    public async Task CreateEventAsync_WithValidData_ShouldCreateEvent()
    {
        // Arrange
        var organizerId = 1;
        var categoryId = 1;

        // Setup test data
        var organizer = new Organizer
        {
            Id = organizerId,
            UserId = 1,
            CompanyName = "Test Organizer"
        };
        var user = new User
        {
            Id = 1,
            Email = "organizer@test.com",
            FullName = "Test User"
        };
        organizer.User = user;

        var category = new Category
        {
            Id = categoryId,
            Name = "Test Category",
            IsActive = true
        };

        _context.Organizers.Add(organizer);
        _context.Users.Add(user);
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var createDto = new CreateEventDto
        {
            OrganizerId = organizerId,
            CategoryId = categoryId,
            Title = "New Event",
            Description = "Event Description",
            Venue = "Test Venue",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(8),
            TotalSeats = 100,
            TicketTypes = new List<CreateTicketTypeDto>
            {
                new CreateTicketTypeDto
                {
                    TypeName = "VIP",
                    Price = 100,
                    Quantity = 50,
                    Description = "VIP Ticket"
                }
            }
        };

        var createdEvent = new Event
        {
            Id = 1,
            Title = createDto.Title,
            Description = createDto.Description,
            Location = createDto.Venue,
            OrganizerId = organizerId,
            CategoryId = categoryId,
            Status = EventStatus.Pending,
            StartDate = createDto.StartDate,
            EndDate = createDto.EndDate,
            MaxCapacity = createDto.TotalSeats,
            CreatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<Event>()))
            .ReturnsAsync(createdEvent);

        _mockRepository
            .Setup(r => r.GetByIdAsync(It.IsAny<int>(), true))
            .ReturnsAsync(createdEvent);

        // Act
        var result = await _eventService.CreateEventAsync(createDto, organizerId);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("New Event");
        result.Status.Should().Be("Pending");
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Event>()), Times.Once);
        _mockEmailService.Verify(
            e => e.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateEventAsync_WithInvalidOrganizer_ShouldThrowNotFoundException()
    {
        // Arrange
        var organizerId = 999;
        var categoryId = 1;

        var category = new Category
        {
            Id = categoryId,
            Name = "Test Category",
            IsActive = true
        };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var createDto = new CreateEventDto
        {
            OrganizerId = organizerId,
            CategoryId = categoryId,
            Title = "New Event",
            Description = "Event Description",
            Venue = "Test Venue",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(8),
            TotalSeats = 100
        };

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => _eventService.CreateEventAsync(createDto, organizerId));
    }

    [Fact]
    public async Task CreateEventAsync_WithInvalidCategory_ShouldThrowNotFoundException()
    {
        // Arrange
        var organizerId = 1;
        var categoryId = 999;

        var organizer = new Organizer
        {
            Id = organizerId,
            UserId = 1,
            CompanyName = "Test Organizer"
        };
        var user = new User
        {
            Id = 1,
            Email = "organizer@test.com",
            FullName = "Test User"
        };
        organizer.User = user;

        _context.Organizers.Add(organizer);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var createDto = new CreateEventDto
        {
            OrganizerId = organizerId,
            CategoryId = categoryId,
            Title = "New Event",
            Description = "Event Description",
            Venue = "Test Venue",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(8),
            TotalSeats = 100
        };

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => _eventService.CreateEventAsync(createDto, organizerId));
    }

    [Fact]
    public async Task CreateEventAsync_WithEndDateBeforeStartDate_ShouldThrowBadRequestException()
    {
        // Arrange
        var organizerId = 1;
        var categoryId = 1;

        var organizer = new Organizer
        {
            Id = organizerId,
            UserId = 1,
            CompanyName = "Test Organizer"
        };
        var user = new User
        {
            Id = 1,
            Email = "organizer@test.com",
            FullName = "Test User"
        };
        organizer.User = user;

        var category = new Category
        {
            Id = categoryId,
            Name = "Test Category",
            IsActive = true
        };

        _context.Organizers.Add(organizer);
        _context.Users.Add(user);
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var createDto = new CreateEventDto
        {
            OrganizerId = organizerId,
            CategoryId = categoryId,
            Title = "New Event",
            Description = "Event Description",
            Venue = "Test Venue",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(6), // End date before start date
            TotalSeats = 100
        };

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => _eventService.CreateEventAsync(createDto, organizerId));
    }

    #endregion

    #region SearchEventsAsync Tests

    [Fact]
    public async Task SearchEventsAsync_WithValidSearchTerm_ShouldReturnResults()
    {
        // Arrange
        var searchTerm = "concert";
        var events = new List<Event>
        {
            new Event { Id = 1, Title = "Concert Event", Status = EventStatus.Published }
        };

        var pagedResult = new PagedResult<Event>(
            events,
            totalCount: 1,
            pageNumber: 1,
            pageSize: 20
        );

        _mockRepository
            .Setup(r => r.SearchEventsAsync(searchTerm, 1, 20))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _eventService.SearchEventsAsync(searchTerm);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(1);
        _mockRepository.Verify(r => r.SearchEventsAsync(searchTerm, 1, 20), Times.Once);
    }

    [Fact]
    public async Task SearchEventsAsync_WithEmptySearchTerm_ShouldThrowBadRequestException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => _eventService.SearchEventsAsync(""));
    }

    [Fact]
    public async Task SearchEventsAsync_WithWhitespaceSearchTerm_ShouldThrowBadRequestException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => _eventService.SearchEventsAsync("   "));
    }

    #endregion

    #region GetFeaturedEventsAsync Tests

    [Fact]
    public async Task GetFeaturedEventsAsync_ShouldReturnFeaturedEvents()
    {
        // Arrange
        var count = 5;
        var events = new List<Event>
        {
            new Event { Id = 1, Title = "Featured 1", Status = EventStatus.Published },
            new Event { Id = 2, Title = "Featured 2", Status = EventStatus.Published }
        };

        _mockRepository
            .Setup(r => r.GetFeaturedEventsAsync(count))
            .ReturnsAsync(events);

        // Act
        var result = await _eventService.GetFeaturedEventsAsync(count);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        _mockRepository.Verify(r => r.GetFeaturedEventsAsync(count), Times.Once);
    }

    #endregion

    #region GetUpcomingEventsAsync Tests

    [Fact]
    public async Task GetUpcomingEventsAsync_ShouldReturnUpcomingEvents()
    {
        // Arrange
        var count = 10;
        var events = new List<Event>
        {
            new Event
            {
                Id = 1,
                Title = "Upcoming 1",
                Status = EventStatus.Published,
                StartDate = DateTime.UtcNow.AddDays(1)
            }
        };

        _mockRepository
            .Setup(r => r.GetUpcomingEventsAsync(count))
            .ReturnsAsync(events);

        // Act
        var result = await _eventService.GetUpcomingEventsAsync(count);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        _mockRepository.Verify(r => r.GetUpcomingEventsAsync(count), Times.Once);
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}

