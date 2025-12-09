using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Tickify.Common;
using Tickify.Controllers;
using Tickify.DTOs.PromoCode;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Xunit;

namespace Tickify.Tests.Controllers
{
    public class PromoCodeControllerTests
    {
        private readonly Mock<IPromoCodeService> _mockPromoCodeService;
        private readonly PromoCodeController _controller;
        private readonly int _testUserId = 100;

        public PromoCodeControllerTests()
        {
            _mockPromoCodeService = new Mock<IPromoCodeService>();
            _controller = new PromoCodeController(_mockPromoCodeService.Object);

            // Setup authenticated organizer user context
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()),
                new Claim("userId", _testUserId.ToString()),
                new Claim(ClaimTypes.Role, "Organizer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        #region ValidatePromoCode Tests

        [Fact]
        public async Task ValidatePromoCode_WithValidCode_ReturnsOkResult()
        {
            // Arrange
            var validateDto = new ValidatePromoCodeDto
            {
                Code = "SUMMER2024",
                EventId = 1,
                OrderTotal = 500000
            };

            var expectedPromoCode = new PromoCodeDto
            {
                PromoCodeId = 1,
                Code = "SUMMER2024",
                DiscountType = "Percentage",
                DiscountValue = 10,
                IsActive = true
            };

            _mockPromoCodeService
                .Setup(s => s.ValidatePromoCodeAsync(validateDto))
                .ReturnsAsync(expectedPromoCode);

            // Act
            var result = await _controller.ValidatePromoCode(validateDto);

            // Assert
            var okResult = Assert.IsType<ActionResult<ApiResponse<PromoCodeDto>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var response = Assert.IsType<ApiResponse<PromoCodeDto>>(objectResult.Value);

            Assert.True(response.Success);
            Assert.Equal("SUMMER2024", response.Data.Code);
            Assert.Contains("validated successfully", response.Message);

            _mockPromoCodeService.Verify(s => s.ValidatePromoCodeAsync(validateDto), Times.Once);
        }

        [Fact]
        public async Task ValidatePromoCode_InvalidCode_ThrowsNotFoundException()
        {
            // Arrange
            var validateDto = new ValidatePromoCodeDto
            {
                Code = "INVALID",
                EventId = 1,
                OrderTotal = 500000
            };

            _mockPromoCodeService
                .Setup(s => s.ValidatePromoCodeAsync(validateDto))
                .ThrowsAsync(new NotFoundException("Promo code not found"));

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => 
                _controller.ValidatePromoCode(validateDto));

            _mockPromoCodeService.Verify(s => s.ValidatePromoCodeAsync(validateDto), Times.Once);
        }

        [Fact]
        public async Task ValidatePromoCode_ExpiredCode_ThrowsBadRequestException()
        {
            // Arrange
            var validateDto = new ValidatePromoCodeDto
            {
                Code = "EXPIRED2023",
                EventId = 1,
                OrderTotal = 500000
            };

            _mockPromoCodeService
                .Setup(s => s.ValidatePromoCodeAsync(validateDto))
                .ThrowsAsync(new BadRequestException("Promo code has expired"));

            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(() => 
                _controller.ValidatePromoCode(validateDto));
        }

        #endregion

        #region GetByEventId Tests

        [Fact]
        public async Task GetByEventId_WithValidEventId_ReturnsPromoCodes()
        {
            // Arrange
            var eventId = 1;
            var expectedPromoCodes = new List<PromoCodeDto>
            {
                new PromoCodeDto { PromoCodeId = 1, Code = "EVENT10", EventId = eventId, IsActive = true },
                new PromoCodeDto { PromoCodeId = 2, Code = "EVENT20", EventId = eventId, IsActive = true }
            };

            _mockPromoCodeService
                .Setup(s => s.GetByEventIdAsync(eventId))
                .ReturnsAsync(expectedPromoCodes);

            // Act
            var result = await _controller.GetByEventId(eventId);

            // Assert
            var okResult = Assert.IsType<ActionResult<ApiResponse<IEnumerable<PromoCodeDto>>>>(result);
            var objectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var response = Assert.IsType<ApiResponse<IEnumerable<PromoCodeDto>>>(objectResult.Value);

            Assert.True(response.Success);
            Assert.Equal(2, response.Data.Count());
            Assert.All(response.Data, pc => Assert.Equal(eventId, pc.EventId));

            _mockPromoCodeService.Verify(s => s.GetByEventIdAsync(eventId), Times.Once);
        }

        #endregion
    }
}
