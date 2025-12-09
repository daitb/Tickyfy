using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Tickify.Common;
using Tickify.Controllers;
using Tickify.DTOs.Ticket;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Services.Email;
using Xunit;
using Microsoft.Extensions.Logging;

namespace Tickify.Tests.Controllers
{
    public class TicketControllerTests
    {
        private readonly Mock<ITicketService> _mockTicketService;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IBookingRepository> _mockBookingRepository;
        private readonly Mock<ILogger<TicketController>> _mockLogger;
        private readonly TicketController _controller;
        private readonly int _testUserId = 100;

        public TicketControllerTests()
        {
            _mockTicketService = new Mock<ITicketService>();
            _mockEmailService = new Mock<IEmailService>();
            _mockBookingRepository = new Mock<IBookingRepository>();
            _mockLogger = new Mock<ILogger<TicketController>>();

            _controller = new TicketController(
                _mockTicketService.Object,
                _mockEmailService.Object,
                _mockBookingRepository.Object,
                _mockLogger.Object
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

        #region GetTicketById Tests

        [Fact]
        public async Task GetTicketById_WithValidId_ReturnsOkResult()
        {
            // Arrange
            var ticketId = 1;
            var expectedTicket = new TicketDetailDto
            {
                TicketId = ticketId,
                TicketNumber = "TKT-001",
                EventTitle = "Test Event",
                Status = "Active"
            };

            var userTickets = new List<TicketDetailDto> { expectedTicket };

            _mockTicketService
                .Setup(s => s.GetUserTicketsAsync(_testUserId))
                .ReturnsAsync(userTickets);

            // Act
            var result = await _controller.GetTicketById(ticketId);

            // Assert
            var okResult = Assert.IsType<ActionResult<ApiResponse<TicketDetailDto>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var response = Assert.IsType<ApiResponse<TicketDetailDto>>(objectResult.Value);

            Assert.True(response.Success);
            Assert.Equal(ticketId, response.Data.TicketId);
            Assert.Equal("TKT-001", response.Data.TicketNumber);

            _mockTicketService.Verify(s => s.GetUserTicketsAsync(_testUserId), Times.Once);
        }

        [Fact]
        public async Task GetTicketById_NotFound_ReturnsForbidden()
        {
            // Arrange
            var ticketId = 999;
            var userTickets = new List<TicketDetailDto>(); // Empty list

            _mockTicketService
                .Setup(s => s.GetUserTicketsAsync(_testUserId))
                .ReturnsAsync(userTickets);

            // Act
            var result = await _controller.GetTicketById(ticketId);

            // Assert
            var forbiddenResult = Assert.IsType<ActionResult<ApiResponse<TicketDetailDto>>>(result);
            var objectResult = Assert.IsType<ObjectResult>(forbiddenResult.Result);
            
            Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
            
            var response = Assert.IsType<ApiResponse<object>>(objectResult.Value);
            Assert.False(response.Success);
            Assert.Contains("permission", response.Message);
        }

        #endregion

        #region TransferTicket Tests

        [Fact]
        public async Task TransferTicket_WithValidDto_ReturnsOkResult()
        {
            // Arrange
            var ticketId = 1;
            var transferDto = new TicketTransferDto
            {
                RecipientEmail = "recipient@example.com",
                Message = "Transfer ticket"
            };

            var expectedTicket = new TicketDto
            {
                TicketId = ticketId,
                TicketNumber = "TKT-001",
                Status = "PendingTransfer"
            };

            _mockTicketService
                .Setup(s => s.TransferTicketAsync(ticketId, transferDto, _testUserId))
                .ReturnsAsync(expectedTicket);

            // Act
            var result = await _controller.TransferTicket(ticketId, transferDto);

            // Assert
            var okResult = Assert.IsType<ActionResult<ApiResponse<TicketDto>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var response = Assert.IsType<ApiResponse<TicketDto>>(objectResult.Value);

            Assert.True(response.Success);
            Assert.Equal(ticketId, response.Data.TicketId);
            Assert.Contains("transfer initiated", response.Message);

            _mockTicketService.Verify(s => s.TransferTicketAsync(ticketId, transferDto, _testUserId), Times.Once);
        }

        [Fact]
        public async Task TransferTicket_InvalidEmail_ThrowsBadRequestException()
        {
            // Arrange
            var ticketId = 1;
            var transferDto = new TicketTransferDto
            {
                RecipientEmail = "invalid-email",
                Message = "Test"
            };

            _mockTicketService
                .Setup(s => s.TransferTicketAsync(ticketId, transferDto, _testUserId))
                .ThrowsAsync(new BadRequestException("Invalid email format"));

            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(() => 
                _controller.TransferTicket(ticketId, transferDto));

            _mockTicketService.Verify(s => s.TransferTicketAsync(ticketId, transferDto, _testUserId), Times.Once);
        }

        [Fact]
        public async Task TransferTicket_TicketNotFound_ThrowsNotFoundException()
        {
            // Arrange
            var ticketId = 999;
            var transferDto = new TicketTransferDto
            {
                RecipientEmail = "recipient@example.com",
                Message = "Test"
            };

            _mockTicketService
                .Setup(s => s.TransferTicketAsync(ticketId, transferDto, _testUserId))
                .ThrowsAsync(new NotFoundException("Ticket not found"));

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => 
                _controller.TransferTicket(ticketId, transferDto));
        }

        #endregion

        #region GetMyTickets Tests

        [Fact]
        public async Task GetMyTickets_ReturnsUserTickets()
        {
            // Arrange
            var expectedTickets = new List<TicketDetailDto>
            {
                new TicketDetailDto { TicketId = 1, TicketNumber = "TKT-001", Status = "Active" },
                new TicketDetailDto { TicketId = 2, TicketNumber = "TKT-002", Status = "Active" }
            };

            _mockTicketService
                .Setup(s => s.GetUserTicketsAsync(_testUserId))
                .ReturnsAsync(expectedTickets);

            // Act
            var result = await _controller.GetMyTickets(null, null);

            // Assert
            var okResult = Assert.IsType<ActionResult<ApiResponse<IEnumerable<TicketDetailDto>>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var response = Assert.IsType<ApiResponse<IEnumerable<TicketDetailDto>>>(objectResult.Value);

            Assert.True(response.Success);
            Assert.Equal(2, response.Data.Count());

            _mockTicketService.Verify(s => s.GetUserTicketsAsync(_testUserId), Times.Once);
        }

        #endregion
    }
}
