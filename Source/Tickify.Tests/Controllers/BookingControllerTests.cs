using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Tickify.Common;
using Tickify.Controllers;
using Tickify.DTOs.Booking;
using Tickify.Interfaces.Services;
using Xunit;

namespace Tickify.Tests.Controllers;

/// <summary>
/// Unit tests cho BookingController
/// </summary>
public class BookingControllerTests
{
    private readonly Mock<IBookingService> _mockBookingService;
    private readonly Mock<ITicketService> _mockTicketService;
    private readonly Mock<IPromoCodeService> _mockPromoCodeService;
    private readonly BookingController _controller;

    public BookingControllerTests()
    {
        _mockBookingService = new Mock<IBookingService>();
        _mockTicketService = new Mock<ITicketService>();
        _mockPromoCodeService = new Mock<IPromoCodeService>();

        _controller = new BookingController(
            _mockBookingService.Object,
            _mockTicketService.Object,
            _mockPromoCodeService.Object
        );

        // Setup default user claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }

    #region CreateBooking Tests

    [Fact]
    public async Task CreateBooking_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var createDto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 2
        };

        var confirmation = new BookingConfirmationDto
        {
            BookingId = 1,
            BookingNumber = "BK001",
            EventTitle = "Test Event",
            Quantity = 2,
            TotalPrice = 210,
            PaymentStatus = "Pending"
        };

        _mockBookingService
            .Setup(s => s.CreateBookingAsync(createDto, 1))
            .ReturnsAsync(confirmation);

        // Act
        var result = await _controller.CreateBooking(createDto);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<BookingConfirmationDto>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
        response.Data.Should().NotBeNull();
        response.Data!.BookingId.Should().Be(1);
    }

    [Fact]
    public async Task CreateBooking_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var controllerWithoutAuth = new BookingController(
            _mockBookingService.Object,
            _mockTicketService.Object,
            _mockPromoCodeService.Object
        );
        controllerWithoutAuth.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal()
            }
        };

        var createDto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 2
        };

        // Act
        var result = await controllerWithoutAuth.CreateBooking(createDto);

        // Assert
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    #endregion

    #region GetBookingById Tests

    [Fact]
    public async Task GetBookingById_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var bookingId = 1;
        var bookingDetail = new BookingDetailDto
        {
            BookingId = bookingId,
            UserId = 1,
            EventId = 1,
            TotalPrice = 210,
            Status = "Confirmed"
        };

        _mockBookingService
            .Setup(s => s.GetBookingDetailsAsync(bookingId, 1))
            .ReturnsAsync(bookingDetail);

        // Act
        var result = await _controller.GetBookingById(bookingId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<BookingDetailDto>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
        response.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task GetBookingById_WithDifferentUser_ShouldReturnForbidden()
    {
        // Arrange
        var bookingId = 1;
        var bookingDetail = new BookingDetailDto
        {
            BookingId = bookingId,
            UserId = 2, // Different user
            EventId = 1,
            TotalPrice = 210,
            Status = "Confirmed"
        };

        _mockBookingService
            .Setup(s => s.GetBookingDetailsAsync(bookingId, 1))
            .ReturnsAsync(bookingDetail);

        // Act
        var result = await _controller.GetBookingById(bookingId);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(403);
    }

    #endregion

    #region GetMyBookings Tests

    [Fact]
    public async Task GetMyBookings_ShouldReturnOk()
    {
        // Arrange
        var bookings = new List<BookingListDto>
        {
            new BookingListDto
            {
                BookingId = 1,
                BookingNumber = "BK001",
                EventTitle = "Event 1",
                TotalPrice = 210,
                Status = "Confirmed"
            },
            new BookingListDto
            {
                BookingId = 2,
                BookingNumber = "BK002",
                EventTitle = "Event 2",
                TotalPrice = 150,
                Status = "Pending"
            }
        };

        _mockBookingService
            .Setup(s => s.GetByUserIdAsync(1))
            .ReturnsAsync(bookings);

        // Act
        var result = await _controller.GetMyBookings();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<IEnumerable<BookingListDto>>;
        response.Should().NotBeNull();
        response!.Success.Should().BeTrue();
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetMyBookings_WithStatusFilter_ShouldFilterResults()
    {
        // Arrange
        var bookings = new List<BookingListDto>
        {
            new BookingListDto
            {
                BookingId = 1,
                BookingNumber = "BK001",
                EventTitle = "Event 1",
                TotalPrice = 210,
                Status = "Confirmed"
            },
            new BookingListDto
            {
                BookingId = 2,
                BookingNumber = "BK002",
                EventTitle = "Event 2",
                TotalPrice = 150,
                Status = "Pending"
            }
        };

        _mockBookingService
            .Setup(s => s.GetByUserIdAsync(1))
            .ReturnsAsync(bookings);

        // Act
        var result = await _controller.GetMyBookings(status: "Confirmed");

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<IEnumerable<BookingListDto>>;
        response.Should().NotBeNull();
        // After filtering, should only have Confirmed bookings
        response!.Data.Should().OnlyContain(b => b.Status == "Confirmed");
    }

    #endregion
}

