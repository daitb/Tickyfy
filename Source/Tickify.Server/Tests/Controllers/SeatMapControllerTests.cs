using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Tickify.Controllers;
using Tickify.DTOs.SeatMap;
using Tickify.Services;
using Xunit;

namespace Tickify.Tests.Controllers
{
    public class SeatMapControllerTests
    {
        private readonly Mock<ISeatMapService> _mockSeatMapService;
        private readonly SeatMapController _controller;
        private readonly int _testUserId = 100;

        public SeatMapControllerTests()
        {
            _mockSeatMapService = new Mock<ISeatMapService>();
            _controller = new SeatMapController(_mockSeatMapService.Object);

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

        #region GetSeatMap Tests

        [Fact]
        public async Task GetSeatMap_WithValidId_ReturnsOkResult()
        {
            // Arrange
            var seatMapId = 1;
            var expectedSeatMap = new SeatMapResponseDto
            {
                Id = seatMapId,
                Name = "Concert Hall",
                TotalRows = 10,
                TotalColumns = 10
            };

            _mockSeatMapService
                .Setup(s => s.GetSeatMapByIdAsync(seatMapId))
                .ReturnsAsync(expectedSeatMap);

            // Act
            var result = await _controller.GetSeatMap(seatMapId);

            // Assert
            var okResult = Assert.IsType<ActionResult<SeatMapResponseDto>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var seatMap = Assert.IsType<SeatMapResponseDto>(objectResult.Value);

            Assert.Equal(seatMapId, seatMap.Id);
            Assert.Equal("Concert Hall", seatMap.Name);

            _mockSeatMapService.Verify(s => s.GetSeatMapByIdAsync(seatMapId), Times.Once);
        }

        [Fact]
        public async Task GetSeatMap_NotFound_ReturnsNotFound()
        {
            // Arrange
            var seatMapId = 999;

            _mockSeatMapService
                .Setup(s => s.GetSeatMapByIdAsync(seatMapId))
                .ReturnsAsync((SeatMapResponseDto?)null);

            // Act
            var result = await _controller.GetSeatMap(seatMapId);

            // Assert
            var notFoundResult = Assert.IsType<ActionResult<SeatMapResponseDto>>(result);
            Assert.IsType<NotFoundObjectResult>(notFoundResult.Result);
        }

        #endregion

        #region GetEventSeats Tests

        [Fact]
        public async Task GetEventSeats_WithValidEventId_ReturnsSeats()
        {
            // Arrange
            var eventId = 1;
            var expectedSeats = new List<SeatResponseDto>
            {
                new SeatResponseDto { Id = 1, Row = "A", SeatNumber = "1", Status = "Available" },
                new SeatResponseDto { Id = 2, Row = "A", SeatNumber = "2", Status = "Reserved" },
                new SeatResponseDto { Id = 3, Row = "B", SeatNumber = "1", Status = "Sold" }
            };

            _mockSeatMapService
                .Setup(s => s.GetEventSeatsAsync(eventId))
                .ReturnsAsync(expectedSeats);

            // Act
            var result = await _controller.GetEventSeats(eventId);

            // Assert
            var okResult = Assert.IsType<ActionResult<List<SeatResponseDto>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var seats = Assert.IsType<List<SeatResponseDto>>(objectResult.Value);

            Assert.Equal(3, seats.Count);
            Assert.Contains(seats, s => s.Status == "Available");
            Assert.Contains(seats, s => s.Status == "Reserved");
            Assert.Contains(seats, s => s.Status == "Sold");

            _mockSeatMapService.Verify(s => s.GetEventSeatsAsync(eventId), Times.Once);
        }

        [Fact]
        public async Task GetEventSeats_ServiceThrowsException_ReturnsBadRequest()
        {
            // Arrange
            var eventId = 1;

            _mockSeatMapService
                .Setup(s => s.GetEventSeatsAsync(eventId))
                .ThrowsAsync(new Exception("Database connection failed"));

            // Act
            var result = await _controller.GetEventSeats(eventId);

            // Assert
            var badRequestResult = Assert.IsType<ActionResult<List<SeatResponseDto>>>(result);
            var objectResult = Assert.IsType<BadRequestObjectResult>(badRequestResult.Result);
            
            Assert.NotNull(objectResult.Value);
        }

        #endregion

        #region ReserveSeats Tests

        [Fact]
        public async Task ReserveSeats_WithValidSeats_ReturnsOkResult()
        {
            // Arrange
            var seatMapId = 1;
            var seatIds = new List<int> { 1, 2, 3 };

            _mockSeatMapService
                .Setup(s => s.ReserveSeatsAsync(seatIds, _testUserId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.ReserveSeats(seatMapId, seatIds);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            _mockSeatMapService.Verify(s => s.ReserveSeatsAsync(seatIds, _testUserId), Times.Once);
        }

        [Fact]
        public async Task ReserveSeats_SeatsUnavailable_ReturnsBadRequest()
        {
            // Arrange
            var seatMapId = 1;
            var seatIds = new List<int> { 1, 2 };

            _mockSeatMapService
                .Setup(s => s.ReserveSeatsAsync(seatIds, _testUserId))
                .ReturnsAsync(false); // Seats not available

            // Act
            var result = await _controller.ReserveSeats(seatMapId, seatIds);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        public async Task ReserveSeats_EmptySeatList_ReturnsBadRequest()
        {
            // Arrange
            var seatMapId = 1;
            var seatIds = new List<int>(); // Empty list

            // Act
            var result = await _controller.ReserveSeats(seatMapId, seatIds);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);

            _mockSeatMapService.Verify(s => s.ReserveSeatsAsync(It.IsAny<List<int>>(), It.IsAny<int>()), Times.Never);
        }

        #endregion

        #region ReleaseSeats Tests

        [Fact]
        public async Task ReleaseSeats_WithValidRequest_ReturnsOkResult()
        {
            // Arrange
            var seatMapId = 1;
            var seatIds = new List<int> { 1, 2 };

            _mockSeatMapService
                .Setup(s => s.ReleaseSeatsAsync(seatIds, _testUserId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.ReleaseSeats(seatMapId, seatIds);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            _mockSeatMapService.Verify(s => s.ReleaseSeatsAsync(seatIds, _testUserId), Times.Once);
        }

        #endregion

        #region ExtendReservation Tests

        [Fact]
        public async Task ExtendReservation_FirstTime_ReturnsOkResult()
        {
            // Arrange
            var seatMapId = 1;
            var seatIds = new List<int> { 1, 2 };

            _mockSeatMapService
                .Setup(s => s.ExtendReservationAsync(seatIds, _testUserId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.ExtendReservation(seatMapId, seatIds);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            _mockSeatMapService.Verify(s => s.ExtendReservationAsync(seatIds, _testUserId), Times.Once);
        }

        [Fact]
        public async Task ExtendReservation_AlreadyExtended_ReturnsBadRequest()
        {
            // Arrange
            var seatMapId = 1;
            var seatIds = new List<int> { 1, 2 };

            _mockSeatMapService
                .Setup(s => s.ExtendReservationAsync(seatIds, _testUserId))
                .ReturnsAsync(false); // Already extended

            // Act
            var result = await _controller.ExtendReservation(seatMapId, seatIds);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        #endregion

        #region AdminLockSeats Tests

        [Fact]
        public async Task AdminLockSeats_WithOrganizerRole_ReturnsOkResult()
        {
            // Arrange
            var adminId = 1;
            var lockDto = new AdminLockSeatsDto
            {
                SeatIds = new List<int> { 1, 2, 3 },
                Reason = "VIP reserved"
            };

            // Setup admin/organizer user context
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, adminId.ToString()),
                new Claim(ClaimTypes.Role, "Organizer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };

            _mockSeatMapService
                .Setup(s => s.AdminLockSeatsAsync(lockDto.SeatIds, adminId, lockDto.Reason))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.AdminLockSeats(lockDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            _mockSeatMapService.Verify(s => s.AdminLockSeatsAsync(lockDto.SeatIds, adminId, lockDto.Reason), Times.Once);
        }

        #endregion
    }
}
