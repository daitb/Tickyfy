using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Tickify.Data;
using Tickify.DTOs.Booking;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
using Tickify.Services;
using Tickify.Tests.Helpers;
using Xunit;

namespace Tickify.Tests.Services;

/// <summary>
/// Unit tests cho BookingService
/// </summary>
public class BookingServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IBookingRepository> _mockBookingRepository;
    private readonly Mock<ITicketRepository> _mockTicketRepository;
    private readonly Mock<ISeatRepository> _mockSeatRepository;
    private readonly Mock<IPromoCodeRepository> _mockPromoCodeRepository;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<ILogger<BookingService>> _mockLogger;
    private readonly BookingService _bookingService;

    public BookingServiceTests()
    {
        _context = TestDbContextFactory.Create();
        _mockBookingRepository = new Mock<IBookingRepository>();
        _mockTicketRepository = new Mock<ITicketRepository>();
        _mockSeatRepository = new Mock<ISeatRepository>();
        _mockPromoCodeRepository = new Mock<IPromoCodeRepository>();
        _mockMapper = new Mock<IMapper>();
        _mockLogger = new Mock<ILogger<BookingService>>();

        _bookingService = new BookingService(
            _mockBookingRepository.Object,
            _mockTicketRepository.Object,
            _mockSeatRepository.Object,
            _mockPromoCodeRepository.Object,
            _context,
            _mockMapper.Object,
            _mockLogger.Object
        );
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnBooking()
    {
        // Arrange
        var bookingId = 1;
        var booking = new Booking
        {
            Id = bookingId,
            BookingCode = "BK001",
            UserId = 1,
            EventId = 1,
            TotalAmount = 100,
            Status = BookingStatus.Confirmed
        };

        var bookingDto = new BookingDto
        {
            BookingId = bookingId,
            BookingNumber = "BK001",
            TotalPrice = 100,
            Status = "Confirmed"
        };

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync(booking);

        _mockMapper
            .Setup(m => m.Map<BookingDto>(booking))
            .Returns(bookingDto);

        // Act
        var result = await _bookingService.GetByIdAsync(bookingId);

        // Assert
        result.Should().NotBeNull();
        result.BookingId.Should().Be(bookingId);
        _mockBookingRepository.Verify(r => r.GetByIdAsync(bookingId), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var bookingId = 999;
        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync((Booking?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => _bookingService.GetByIdAsync(bookingId));
    }

    #endregion

    #region GetByBookingCodeAsync Tests

    [Fact]
    public async Task GetByBookingCodeAsync_WithValidCode_ShouldReturnBooking()
    {
        // Arrange
        var bookingCode = "BK001";
        var booking = new Booking
        {
            Id = 1,
            BookingCode = bookingCode,
            UserId = 1,
            EventId = 1,
            TotalAmount = 100
        };

        var bookingDto = new BookingDto
        {
            BookingId = 1,
            BookingNumber = bookingCode,
            TotalPrice = 100
        };

        _mockBookingRepository
            .Setup(r => r.GetByBookingCodeAsync(bookingCode))
            .ReturnsAsync(booking);

        _mockMapper
            .Setup(m => m.Map<BookingDto>(booking))
            .Returns(bookingDto);

        // Act
        var result = await _bookingService.GetByBookingCodeAsync(bookingCode);

        // Assert
        result.Should().NotBeNull();
        result.BookingNumber.Should().Be(bookingCode);
        _mockBookingRepository.Verify(r => r.GetByBookingCodeAsync(bookingCode), Times.Once);
    }

    #endregion

    #region CreateBookingAsync Tests

    [Fact]
    public async Task CreateBookingAsync_WithValidData_ShouldCreateBooking()
    {
        // Arrange
        var userId = 1;
        var eventId = 1;
        var ticketTypeId = 1;
        var quantity = 2;

        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            FullName = "Test User"
        };

        var ticketType = new TicketType
        {
            Id = ticketTypeId,
            EventId = eventId,
            Name = "VIP",
            Price = 100,
            TotalQuantity = 100,
            AvailableQuantity = 50,
            IsActive = true
        };

        _context.Users.Add(user);
        _context.TicketTypes.Add(ticketType);
        await _context.SaveChangesAsync();

        var createDto = new CreateBookingDto
        {
            EventId = eventId,
            TicketTypeId = ticketTypeId,
            Quantity = quantity
        };

        var createdBooking = new Booking
        {
            Id = 1,
            BookingCode = "BK001",
            UserId = userId,
            EventId = eventId,
            TotalAmount = 210, // (100 * 2) + (100 * 2 * 0.05) = 200 + 10 = 210
            Status = BookingStatus.Pending
        };

        _mockBookingRepository
            .Setup(r => r.CreateAsync(It.IsAny<Booking>()))
            .ReturnsAsync(createdBooking);

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(It.IsAny<int>()))
            .ReturnsAsync(createdBooking);

        var confirmationDto = new BookingConfirmationDto
        {
            BookingId = 1,
            BookingNumber = "BK001",
            TotalPrice = 210
        };

        _mockMapper
            .Setup(m => m.Map<BookingConfirmationDto>(It.IsAny<Booking>()))
            .Returns(confirmationDto);

        // Act
        var result = await _bookingService.CreateBookingAsync(createDto, userId);

        // Assert
        result.Should().NotBeNull();
        result.BookingNumber.Should().Be("BK001");
        _mockBookingRepository.Verify(r => r.CreateAsync(It.IsAny<Booking>()), Times.Once);
    }

    [Fact]
    public async Task CreateBookingAsync_WithInvalidUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = 999;
        var createDto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 1
        };

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => _bookingService.CreateBookingAsync(createDto, userId));
    }

    [Fact]
    public async Task CreateBookingAsync_WithInvalidTicketType_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = 1;
        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            FullName = "Test User"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var createDto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 999, // Invalid ticket type
            Quantity = 1
        };

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => _bookingService.CreateBookingAsync(createDto, userId));
    }

    [Fact]
    public async Task CreateBookingAsync_WithInactiveTicketType_ShouldThrowBadRequestException()
    {
        // Arrange
        var userId = 1;
        var eventId = 1;
        var ticketTypeId = 1;

        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            FullName = "Test User"
        };

        var ticketType = new TicketType
        {
            Id = ticketTypeId,
            EventId = eventId,
            Name = "VIP",
            Price = 100,
            TotalQuantity = 100,
            AvailableQuantity = 50,
            IsActive = false // Inactive
        };

        _context.Users.Add(user);
        _context.TicketTypes.Add(ticketType);
        await _context.SaveChangesAsync();

        var createDto = new CreateBookingDto
        {
            EventId = eventId,
            TicketTypeId = ticketTypeId,
            Quantity = 1
        };

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => _bookingService.CreateBookingAsync(createDto, userId));
    }

    [Fact]
    public async Task CreateBookingAsync_WithInsufficientQuantity_ShouldThrowBadRequestException()
    {
        // Arrange
        var userId = 1;
        var eventId = 1;
        var ticketTypeId = 1;

        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            FullName = "Test User"
        };

        var ticketType = new TicketType
        {
            Id = ticketTypeId,
            EventId = eventId,
            Name = "VIP",
            Price = 100,
            TotalQuantity = 100,
            AvailableQuantity = 5, // Only 5 available
            IsActive = true
        };

        _context.Users.Add(user);
        _context.TicketTypes.Add(ticketType);
        await _context.SaveChangesAsync();

        var createDto = new CreateBookingDto
        {
            EventId = eventId,
            TicketTypeId = ticketTypeId,
            Quantity = 10 // Requesting 10 but only 5 available
        };

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => _bookingService.CreateBookingAsync(createDto, userId));
    }

    #endregion

    #region CancelBookingAsync Tests

    [Fact]
    public async Task CancelBookingAsync_WithValidBooking_ShouldCancelBooking()
    {
        // Arrange
        var bookingId = 1;
        var userId = 1;

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            EventId = 1,
            Status = BookingStatus.Pending,
            TotalAmount = 100
        };

        var cancelDto = new CancelBookingDto
        {
            CancellationReason = "Changed my mind"
        };

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync(booking);

        _mockTicketRepository
            .Setup(r => r.GetByBookingIdAsync(bookingId))
            .ReturnsAsync(new List<Ticket>());

        var cancelledBooking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = BookingStatus.Cancelled,
            CancellationReason = "Changed my mind"
        };

        _mockBookingRepository
            .Setup(r => r.UpdateAsync(It.IsAny<Booking>()))
            .ReturnsAsync(cancelledBooking);

        var bookingDto = new BookingDto
        {
            BookingId = bookingId,
            Status = "Cancelled"
        };

        _mockMapper
            .Setup(m => m.Map<BookingDto>(It.IsAny<Booking>()))
            .Returns(bookingDto);

        // Act
        var result = await _bookingService.CancelBookingAsync(bookingId, cancelDto, userId);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("Cancelled");
        _mockBookingRepository.Verify(r => r.UpdateAsync(It.IsAny<Booking>()), Times.Once);
    }

    [Fact]
    public async Task CancelBookingAsync_WithDifferentUser_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var bookingId = 1;
        var userId = 1;
        var otherUserId = 2;

        var booking = new Booking
        {
            Id = bookingId,
            UserId = otherUserId, // Different user
            EventId = 1,
            Status = BookingStatus.Pending
        };

        var cancelDto = new CancelBookingDto
        {
            CancellationReason = "Changed my mind"
        };

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync(booking);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(
            () => _bookingService.CancelBookingAsync(bookingId, cancelDto, userId));
    }

    [Fact]
    public async Task CancelBookingAsync_WithAlreadyCancelledBooking_ShouldThrowBadRequestException()
    {
        // Arrange
        var bookingId = 1;
        var userId = 1;

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            EventId = 1,
            Status = BookingStatus.Cancelled // Already cancelled
        };

        var cancelDto = new CancelBookingDto
        {
            CancellationReason = "Changed my mind"
        };

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync(booking);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => _bookingService.CancelBookingAsync(bookingId, cancelDto, userId));
    }

    #endregion

    #region GetBookingDetailsAsync Tests

    [Fact]
    public async Task GetBookingDetailsAsync_WithValidBooking_ShouldReturnDetails()
    {
        // Arrange
        var bookingId = 1;
        var userId = 1;

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            EventId = 1,
            TotalAmount = 100,
            Status = BookingStatus.Confirmed
        };

        var bookingDetailDto = new BookingDetailDto
        {
            BookingId = bookingId,
            TotalPrice = 100,
            Status = "Confirmed"
        };

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync(booking);

        _mockMapper
            .Setup(m => m.Map<BookingDetailDto>(booking))
            .Returns(bookingDetailDto);

        // Act
        var result = await _bookingService.GetBookingDetailsAsync(bookingId, userId);

        // Assert
        result.Should().NotBeNull();
        result.BookingId.Should().Be(bookingId);
        _mockBookingRepository.Verify(r => r.GetByIdAsync(bookingId), Times.Once);
    }

    [Fact]
    public async Task GetBookingDetailsAsync_WithDifferentUser_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var bookingId = 1;
        var userId = 1;
        var otherUserId = 2;

        var booking = new Booking
        {
            Id = bookingId,
            UserId = otherUserId, // Different user
            EventId = 1
        };

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync(booking);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(
            () => _bookingService.GetBookingDetailsAsync(bookingId, userId));
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}

