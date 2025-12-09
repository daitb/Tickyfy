using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Tickify.Common;
using Tickify.Controllers;
using Tickify.DTOs.Booking;
using Tickify.DTOs.PromoCode;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Xunit;

namespace Tickify.Tests.Controllers
{
    public class BookingControllerTests
    {
        private readonly Mock<IBookingService> _mockBookingService;
        private readonly Mock<ITicketService> _mockTicketService;
        private readonly Mock<IPromoCodeService> _mockPromoCodeService;
        private readonly BookingController _controller;
        private readonly int _testUserId = 100;

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

            // Setup authenticated user context
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()),
                new Claim(ClaimTypes.Role, "User")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        #region CreateBooking Tests

        [Fact]
        public async Task CreateBooking_WithValidDto_ReturnsOkResult()
        {
            // Arrange
            var createDto = new CreateBookingDto
            {
                EventId = 1,
                TicketTypeId = 1,
                Quantity = 2,
                SeatIds = new List<int> { 1, 2 }
            };

            var expectedBooking = new BookingConfirmationDto
            {
                BookingId = 1,
                BookingNumber = "BK-001",
                EventTitle = "Test Event",
                TotalPrice = 200000,
                PaymentStatus = "Pending"
            };

            _mockBookingService
                .Setup(s => s.CreateBookingAsync(It.IsAny<CreateBookingDto>(), _testUserId))
                .ReturnsAsync(expectedBooking);

            // Act
            var result = await _controller.CreateBooking(createDto);

            // Assert
            var okResult = Assert.IsType<ActionResult<ApiResponse<BookingConfirmationDto>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var response = Assert.IsType<ApiResponse<BookingConfirmationDto>>(objectResult.Value);

            Assert.True(response.Success);
            Assert.Equal(expectedBooking.BookingId, response.Data.BookingId);
            Assert.Equal(expectedBooking.TotalPrice, response.Data.TotalPrice);
            Assert.Contains("successfully", response.Message);

            _mockBookingService.Verify(s => s.CreateBookingAsync(createDto, _testUserId), Times.Once);
        }

        [Fact]
        public async Task CreateBooking_WithoutAuthentication_ReturnsUnauthorized()
        {
            // Arrange
            var createDto = new CreateBookingDto { EventId = 1, TicketTypeId = 1, Quantity = 2 };

            // Remove authentication
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());

            // Act
            var result = await _controller.CreateBooking(createDto);

            // Assert
            var unauthorizedResult = Assert.IsType<ActionResult<ApiResponse<BookingConfirmationDto>>>(result);
            var objectResult = Assert.IsType<UnauthorizedObjectResult>(unauthorizedResult.Result);
            var response = Assert.IsType<ApiResponse<BookingConfirmationDto>>(objectResult.Value);

            Assert.False(response.Success);
            Assert.Contains("Authentication required", response.Message);
        }

        #endregion

        #region GetBookingById Tests

        [Fact]
        public async Task GetBookingById_WithValidId_ReturnsOkResult()
        {
            // Arrange
            var bookingId = 1;
            var expectedBooking = new BookingDetailDto
            {
                BookingId = bookingId,
                BookingNumber = "BK-001",
                UserId = _testUserId,
                EventId = 1,
                TotalPrice = 200000,
                Status = "Confirmed"
            };

            _mockBookingService
                .Setup(s => s.GetBookingDetailsAsync(bookingId, _testUserId))
                .ReturnsAsync(expectedBooking);

            // Act
            var result = await _controller.GetBookingById(bookingId);

            // Assert
            var okResult = Assert.IsType<ActionResult<ApiResponse<BookingDetailDto>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var response = Assert.IsType<ApiResponse<BookingDetailDto>>(objectResult.Value);

            Assert.True(response.Success);
            Assert.Equal(bookingId, response.Data.BookingId);
            Assert.Equal(_testUserId, response.Data.UserId);

            _mockBookingService.Verify(s => s.GetBookingDetailsAsync(bookingId, _testUserId), Times.Once);
        }

        [Fact]
        public async Task GetBookingById_OtherUserBooking_ReturnsForbidden()
        {
            // Arrange
            var bookingId = 1;
            var otherUserId = 999;
            var booking = new BookingDetailDto
            {
                BookingId = bookingId,
                UserId = otherUserId, // Different user
                EventId = 1,
                Status = "Confirmed"
            };

            _mockBookingService
                .Setup(s => s.GetBookingDetailsAsync(bookingId, _testUserId))
                .ReturnsAsync(booking);

            // Act
            var result = await _controller.GetBookingById(bookingId);

            // Assert
            var forbiddenResult = Assert.IsType<ActionResult<ApiResponse<BookingDetailDto>>>(result);
            var objectResult = Assert.IsType<ObjectResult>(forbiddenResult.Result);
            
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
            
            var response = Assert.IsType<ApiResponse<object>>(objectResult.Value);
            Assert.False(response.Success);
            Assert.Contains("permission", response.Message);
        }

        #endregion

        #region CancelBooking Tests

        [Fact]
        public async Task CancelBooking_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var bookingId = 1;
            var cancelDto = new CancelBookingDto { CancellationReason = "Changed plans" };

            var existingBooking = new BookingDto
            {
                BookingId = bookingId,
                UserId = _testUserId,
                Status = "Pending"
            };

            var cancelledBooking = new BookingDto
            {
                BookingId = bookingId,
                UserId = _testUserId,
                Status = "Cancelled"
            };

            _mockBookingService
                .Setup(s => s.GetByIdAsync(bookingId))
                .ReturnsAsync(existingBooking);

            _mockBookingService
                .Setup(s => s.CancelBookingAsync(bookingId, cancelDto, _testUserId))
                .ReturnsAsync(cancelledBooking);

            // Act
            var result = await _controller.CancelBooking(bookingId, cancelDto);

            // Assert
            var okResult = Assert.IsType<ActionResult<ApiResponse<BookingDto>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var response = Assert.IsType<ApiResponse<BookingDto>>(objectResult.Value);

            Assert.True(response.Success);
            Assert.Equal("Cancelled", response.Data.Status);
            Assert.Contains("cancelled successfully", response.Message);

            _mockBookingService.Verify(s => s.CancelBookingAsync(bookingId, cancelDto, _testUserId), Times.Once);
        }

        [Fact]
        public async Task CancelBooking_OtherUserBooking_ReturnsForbidden()
        {
            // Arrange
            var bookingId = 1;
            var cancelDto = new CancelBookingDto { CancellationReason = "Test" };
            var otherUserId = 999;

            var booking = new BookingDto
            {
                BookingId = bookingId,
                UserId = otherUserId, // Different user
                Status = "Pending"
            };

            _mockBookingService
                .Setup(s => s.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);

            // Act
            var result = await _controller.CancelBooking(bookingId, cancelDto);

            // Assert
            var forbiddenResult = Assert.IsType<ActionResult<ApiResponse<BookingDto>>>(result);
            var objectResult = Assert.IsType<ObjectResult>(forbiddenResult.Result);
            
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
            
            var response = Assert.IsType<ApiResponse<object>>(objectResult.Value);
            Assert.False(response.Success);
            Assert.Contains("permission", response.Message);

            _mockBookingService.Verify(s => s.CancelBookingAsync(It.IsAny<int>(), It.IsAny<CancelBookingDto>(), It.IsAny<int>()), Times.Never);
        }

        #endregion
    }
}
