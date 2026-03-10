using AutoMapper;
using Moq;
using Tickify.DTOs.PromoCode;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Services;
using Xunit;

namespace Tickify.Tests.Services;

/// <summary>
/// Comprehensive unit tests for PromoCodeService covering validation, discount calculation, 
/// date validation, usage limits, and minimum purchase requirements
/// </summary>
public class PromoCodeServiceTests
{
    private readonly Mock<IPromoCodeRepository> _promoCodeRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IEventRepository> _eventRepositoryMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly PromoCodeService _promoCodeService;

    public PromoCodeServiceTests()
    {
        _promoCodeRepositoryMock = new Mock<IPromoCodeRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _eventRepositoryMock = new Mock<IEventRepository>();
        _mapperMock = new Mock<IMapper>();

        _promoCodeService = new PromoCodeService(
            _promoCodeRepositoryMock.Object,
            _userRepositoryMock.Object,
            _eventRepositoryMock.Object,
            _mapperMock.Object
        );
    }

    #region ValidatePromoCodeAsync Tests

    /// <summary>
    /// Test 1: Validates that a valid promo code is accepted and returned successfully
    /// Scenario: Active promo code with valid dates, no usage limits, and no minimum purchase requirement
    /// Expected: PromoCodeDto is returned without throwing exceptions
    /// </summary>
    [Fact]
    public async Task ValidatePromoCodeAsync_WithValidCode_ReturnsPromoCodeDto()
    {
        // Arrange
        var validateDto = new ValidatePromoCodeDto
        {
            Code = "SUMMER2024",
            EventId = 1,
            OrderTotal = 500000m
        };

        var promoCode = new PromoCode
        {
            Id = 1,
            Code = "SUMMER2024",
            Description = "Summer discount",
            EventId = 1,
            DiscountPercent = 10,
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-7),
            ValidTo = DateTime.UtcNow.AddDays(7),
            MaxUses = 100,
            CurrentUses = 50,
            MinimumPurchase = 100000m
        };

        var promoCodeDto = new PromoCodeDto
        {
            PromoCodeId = 1,
            Code = "SUMMER2024",
            Description = "Summer discount",
            DiscountPercent = 10,
            IsActive = true
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync("SUMMER2024"))
            .ReturnsAsync(promoCode);

        _mapperMock
            .Setup(x => x.Map<PromoCodeDto>(promoCode))
            .Returns(promoCodeDto);

        // Act
        var result = await _promoCodeService.ValidatePromoCodeAsync(validateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("SUMMER2024", result.Code);
        Assert.Equal(10, result.DiscountPercent);
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync("SUMMER2024"), Times.Once);
        _mapperMock.Verify(x => x.Map<PromoCodeDto>(promoCode), Times.Once);
    }

    /// <summary>
    /// Test 2: Validates that an expired promo code throws BadRequestException
    /// Scenario: Promo code with ValidTo date in the past
    /// Expected: BadRequestException with appropriate error message containing expiration date
    /// </summary>
    [Fact]
    public async Task ValidatePromoCodeAsync_ExpiredCode_ThrowsBadRequestException()
    {
        // Arrange
        var validateDto = new ValidatePromoCodeDto
        {
            Code = "EXPIRED2023",
            EventId = 1,
            OrderTotal = 300000m
        };

        var expiredPromoCode = new PromoCode
        {
            Id = 2,
            Code = "EXPIRED2023",
            Description = "Expired promo code",
            EventId = 1,
            DiscountPercent = 15,
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-30),
            ValidTo = DateTime.UtcNow.AddDays(-1), // Expired yesterday
            CurrentUses = 10
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync("EXPIRED2023"))
            .ReturnsAsync(expiredPromoCode);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _promoCodeService.ValidatePromoCodeAsync(validateDto)
        );

        Assert.Contains("expired", exception.Message.ToLower());
        Assert.Contains("EXPIRED2023", exception.Message);
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync("EXPIRED2023"), Times.Once);
        _mapperMock.Verify(x => x.Map<PromoCodeDto>(It.IsAny<PromoCode>()), Times.Never);
    }

    /// <summary>
    /// Test 3: Validates that a promo code with reached maximum usage limit throws BadRequestException
    /// Scenario: Promo code where CurrentUses >= MaxUses
    /// Expected: BadRequestException indicating maximum usage limit reached
    /// </summary>
    [Fact]
    public async Task ValidatePromoCodeAsync_MaxUsageReached_ThrowsBadRequestException()
    {
        // Arrange
        var validateDto = new ValidatePromoCodeDto
        {
            Code = "MAXEDOUT",
            EventId = 1,
            OrderTotal = 400000m
        };

        var maxedPromoCode = new PromoCode
        {
            Id = 3,
            Code = "MAXEDOUT",
            Description = "Fully used promo code",
            EventId = 1,
            DiscountAmount = 50000m,
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-10),
            ValidTo = DateTime.UtcNow.AddDays(10),
            MaxUses = 50,
            CurrentUses = 50 // Reached maximum
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync("MAXEDOUT"))
            .ReturnsAsync(maxedPromoCode);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _promoCodeService.ValidatePromoCodeAsync(validateDto)
        );

        Assert.Contains("maximum usage limit", exception.Message.ToLower());
        Assert.Contains("MAXEDOUT", exception.Message);
        Assert.Contains("50", exception.Message); // MaxUses value
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync("MAXEDOUT"), Times.Once);
    }

    /// <summary>
    /// Test 4: Validates that order below minimum purchase requirement throws BadRequestException
    /// Scenario: Order total less than promo code's MinimumPurchase requirement
    /// Expected: BadRequestException with minimum purchase amount and current order total
    /// </summary>
    [Fact]
    public async Task ValidatePromoCodeAsync_BelowMinimumPurchase_ThrowsBadRequestException()
    {
        // Arrange
        var validateDto = new ValidatePromoCodeDto
        {
            Code = "VIP500K",
            EventId = 1,
            OrderTotal = 300000m // Below minimum
        };

        var promoCode = new PromoCode
        {
            Id = 4,
            Code = "VIP500K",
            Description = "VIP discount for large orders",
            EventId = 1,
            DiscountPercent = 20,
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-5),
            ValidTo = DateTime.UtcNow.AddDays(15),
            MinimumPurchase = 500000m, // Requires 500,000 VND
            MaxUses = 100,
            CurrentUses = 20
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync("VIP500K"))
            .ReturnsAsync(promoCode);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _promoCodeService.ValidatePromoCodeAsync(validateDto)
        );

        Assert.Contains("minimum purchase", exception.Message.ToLower());
        Assert.Contains("500,000", exception.Message); // Minimum purchase amount (formatted)
        Assert.Contains("300,000", exception.Message); // Current order total (formatted)
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync("VIP500K"), Times.Once);
    }

    /// <summary>
    /// Test 5: Validates that inactive promo code throws BadRequestException
    /// Scenario: Promo code with IsActive = false
    /// Expected: BadRequestException indicating the code is not active
    /// </summary>
    [Fact]
    public async Task ValidatePromoCodeAsync_InactiveCode_ThrowsBadRequestException()
    {
        // Arrange
        var validateDto = new ValidatePromoCodeDto
        {
            Code = "DISABLED",
            EventId = 1,
            OrderTotal = 200000m
        };

        var inactivePromoCode = new PromoCode
        {
            Id = 5,
            Code = "DISABLED",
            Description = "Disabled promo code",
            EventId = 1,
            DiscountPercent = 10,
            IsActive = false, // Not active
            ValidFrom = DateTime.UtcNow.AddDays(-5),
            ValidTo = DateTime.UtcNow.AddDays(5)
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync("DISABLED"))
            .ReturnsAsync(inactivePromoCode);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _promoCodeService.ValidatePromoCodeAsync(validateDto)
        );

        Assert.Contains("not active", exception.Message.ToLower());
        Assert.Contains("DISABLED", exception.Message);
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync("DISABLED"), Times.Once);
    }

    /// <summary>
    /// Test 6: Validates that non-existent promo code throws NotFoundException
    /// Scenario: Promo code that doesn't exist in database
    /// Expected: NotFoundException with code name in message
    /// </summary>
    [Fact]
    public async Task ValidatePromoCodeAsync_NonExistentCode_ThrowsNotFoundException()
    {
        // Arrange
        var validateDto = new ValidatePromoCodeDto
        {
            Code = "NOTFOUND",
            EventId = 1,
            OrderTotal = 250000m
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync("NOTFOUND"))
            .ReturnsAsync((PromoCode?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _promoCodeService.ValidatePromoCodeAsync(validateDto)
        );

        Assert.Contains("not found", exception.Message.ToLower());
        Assert.Contains("NOTFOUND", exception.Message);
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync("NOTFOUND"), Times.Once);
    }

    /// <summary>
    /// Test 7: Validates that event-specific promo code validates against correct event
    /// Scenario: Promo code is for Event ID 2, but validation request is for Event ID 1
    /// Expected: BadRequestException indicating code is not valid for this event
    /// </summary>
    [Fact]
    public async Task ValidatePromoCodeAsync_WrongEvent_ThrowsBadRequestException()
    {
        // Arrange
        var validateDto = new ValidatePromoCodeDto
        {
            Code = "EVENT2ONLY",
            EventId = 1, // Wrong event
            OrderTotal = 300000m
        };

        var promoCode = new PromoCode
        {
            Id = 6,
            Code = "EVENT2ONLY",
            Description = "Event 2 specific promo",
            EventId = 2, // For Event 2 only
            DiscountPercent = 15,
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-3),
            ValidTo = DateTime.UtcNow.AddDays(10)
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync("EVENT2ONLY"))
            .ReturnsAsync(promoCode);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _promoCodeService.ValidatePromoCodeAsync(validateDto)
        );

        Assert.Contains("not valid for this event", exception.Message.ToLower());
        Assert.Contains("EVENT2ONLY", exception.Message);
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync("EVENT2ONLY"), Times.Once);
    }

    #endregion

    #region CalculateDiscountAsync Tests

    /// <summary>
    /// Test 8: Validates percentage-based discount calculation
    /// Scenario: 20% discount on 500,000 VND order = 100,000 VND discount
    /// Expected: Correct discount amount of 100,000 VND
    /// </summary>
    [Fact]
    public async Task CalculateDiscountAsync_PercentageType_ReturnsCorrectAmount()
    {
        // Arrange
        var promoCode = "PERCENT20";
        var eventId = 1;
        var orderTotal = 500000m;

        var promoCodeEntity = new PromoCode
        {
            Id = 7,
            Code = "PERCENT20",
            DiscountPercent = 20,
            DiscountAmount = null,
            MinimumPurchase = 100000m,
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-5),
            ValidTo = DateTime.UtcNow.AddDays(5)
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync(promoCode))
            .ReturnsAsync(promoCodeEntity);

        _promoCodeRepositoryMock
            .Setup(x => x.IsPromoCodeValidAsync(promoCode, eventId))
            .ReturnsAsync(true);

        // Act
        var discount = await _promoCodeService.CalculateDiscountAsync(promoCode, eventId, orderTotal);

        // Assert
        Assert.Equal(100000m, discount); // 20% of 500,000 = 100,000
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync(promoCode), Times.Once);
        _promoCodeRepositoryMock.Verify(x => x.IsPromoCodeValidAsync(promoCode, eventId), Times.Once);
    }

    /// <summary>
    /// Test 9: Validates fixed amount discount calculation
    /// Scenario: 50,000 VND fixed discount on 300,000 VND order
    /// Expected: Discount amount of 50,000 VND
    /// </summary>
    [Fact]
    public async Task CalculateDiscountAsync_FixedAmountType_ReturnsCorrectAmount()
    {
        // Arrange
        var promoCode = "FIXED50K";
        var eventId = 1;
        var orderTotal = 300000m;

        var promoCodeEntity = new PromoCode
        {
            Id = 8,
            Code = "FIXED50K",
            DiscountPercent = null,
            DiscountAmount = 50000m, // Fixed 50,000 VND discount
            MinimumPurchase = 200000m,
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-5),
            ValidTo = DateTime.UtcNow.AddDays(5)
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync(promoCode))
            .ReturnsAsync(promoCodeEntity);

        _promoCodeRepositoryMock
            .Setup(x => x.IsPromoCodeValidAsync(promoCode, eventId))
            .ReturnsAsync(true);

        // Act
        var discount = await _promoCodeService.CalculateDiscountAsync(promoCode, eventId, orderTotal);

        // Assert
        Assert.Equal(50000m, discount); // Fixed 50,000 VND
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync(promoCode), Times.Once);
        _promoCodeRepositoryMock.Verify(x => x.IsPromoCodeValidAsync(promoCode, eventId), Times.Once);
    }

    /// <summary>
    /// Test 10: Validates that discount never exceeds order total
    /// Scenario: 100% discount on 200,000 VND order should return 200,000 VND (not more)
    /// Expected: Discount capped at order total (200,000 VND)
    /// </summary>
    [Fact]
    public async Task CalculateDiscountAsync_DiscountExceedsOrderTotal_ReturnsCappedAmount()
    {
        // Arrange
        var promoCode = "FULL100";
        var eventId = 1;
        var orderTotal = 200000m;

        var promoCodeEntity = new PromoCode
        {
            Id = 9,
            Code = "FULL100",
            DiscountPercent = 100, // 100% discount
            DiscountAmount = null,
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-5),
            ValidTo = DateTime.UtcNow.AddDays(5)
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync(promoCode))
            .ReturnsAsync(promoCodeEntity);

        _promoCodeRepositoryMock
            .Setup(x => x.IsPromoCodeValidAsync(promoCode, eventId))
            .ReturnsAsync(true);

        // Act
        var discount = await _promoCodeService.CalculateDiscountAsync(promoCode, eventId, orderTotal);

        // Assert
        Assert.Equal(200000m, discount); // Capped at order total
        Assert.True(discount <= orderTotal); // Never exceeds order total
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync(promoCode), Times.Once);
    }

    /// <summary>
    /// Test 11: Validates that fixed discount exceeding order total is capped
    /// Scenario: 500,000 VND fixed discount on 300,000 VND order should return 300,000 VND
    /// Expected: Discount capped at order total (300,000 VND)
    /// </summary>
    [Fact]
    public async Task CalculateDiscountAsync_FixedAmountExceedsTotal_ReturnsCappedAmount()
    {
        // Arrange
        var promoCode = "HUGE500K";
        var eventId = 1;
        var orderTotal = 300000m;

        var promoCodeEntity = new PromoCode
        {
            Id = 10,
            Code = "HUGE500K",
            DiscountPercent = null,
            DiscountAmount = 500000m, // Exceeds order total
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-5),
            ValidTo = DateTime.UtcNow.AddDays(5)
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync(promoCode))
            .ReturnsAsync(promoCodeEntity);

        _promoCodeRepositoryMock
            .Setup(x => x.IsPromoCodeValidAsync(promoCode, eventId))
            .ReturnsAsync(true);

        // Act
        var discount = await _promoCodeService.CalculateDiscountAsync(promoCode, eventId, orderTotal);

        // Assert
        Assert.Equal(300000m, discount); // Capped at order total
        Assert.True(discount <= orderTotal);
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync(promoCode), Times.Once);
    }

    /// <summary>
    /// Test 12: Validates that invalid promo code throws BadRequestException during discount calculation
    /// Scenario: Promo code is not valid according to repository validation
    /// Expected: BadRequestException indicating code is not valid
    /// </summary>
    [Fact]
    public async Task CalculateDiscountAsync_InvalidPromoCode_ThrowsBadRequestException()
    {
        // Arrange
        var promoCode = "INVALID";
        var eventId = 1;
        var orderTotal = 400000m;

        var promoCodeEntity = new PromoCode
        {
            Id = 11,
            Code = "INVALID",
            DiscountPercent = 15,
            IsActive = false // Not valid
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync(promoCode))
            .ReturnsAsync(promoCodeEntity);

        _promoCodeRepositoryMock
            .Setup(x => x.IsPromoCodeValidAsync(promoCode, eventId))
            .ReturnsAsync(false); // Not valid

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _promoCodeService.CalculateDiscountAsync(promoCode, eventId, orderTotal)
        );

        Assert.Contains("not valid", exception.Message.ToLower());
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync(promoCode), Times.Once);
        _promoCodeRepositoryMock.Verify(x => x.IsPromoCodeValidAsync(promoCode, eventId), Times.Once);
    }

    /// <summary>
    /// Test 13: Validates that minimum purchase requirement is enforced during discount calculation
    /// Scenario: Order total below minimum purchase requirement for promo code
    /// Expected: BadRequestException with minimum purchase requirement message
    /// </summary>
    [Fact]
    public async Task CalculateDiscountAsync_BelowMinimumPurchase_ThrowsBadRequestException()
    {
        // Arrange
        var promoCode = "MIN1M";
        var eventId = 1;
        var orderTotal = 500000m; // Below minimum

        var promoCodeEntity = new PromoCode
        {
            Id = 12,
            Code = "MIN1M",
            DiscountPercent = 25,
            MinimumPurchase = 1000000m, // Requires 1,000,000 VND
            IsActive = true,
            ValidFrom = DateTime.UtcNow.AddDays(-5),
            ValidTo = DateTime.UtcNow.AddDays(5)
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByCodeAsync(promoCode))
            .ReturnsAsync(promoCodeEntity);

        _promoCodeRepositoryMock
            .Setup(x => x.IsPromoCodeValidAsync(promoCode, eventId))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _promoCodeService.CalculateDiscountAsync(promoCode, eventId, orderTotal)
        );

        Assert.Contains("minimum purchase", exception.Message.ToLower());
        _promoCodeRepositoryMock.Verify(x => x.GetByCodeAsync(promoCode), Times.Once);
    }

    #endregion

    #region GetByIdAsync Tests

    /// <summary>
    /// Test 14: Validates that GetByIdAsync returns correct promo code
    /// Scenario: Retrieve existing promo code by ID
    /// Expected: PromoCodeDto with correct data
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_ValidId_ReturnsPromoCodeDto()
    {
        // Arrange
        var promoCodeId = 1;
        var promoCode = new PromoCode
        {
            Id = promoCodeId,
            Code = "TEST123",
            Description = "Test promo",
            DiscountPercent = 10
        };

        var promoCodeDto = new PromoCodeDto
        {
            PromoCodeId = promoCodeId,
            Code = "TEST123",
            Description = "Test promo",
            DiscountPercent = 10
        };

        _promoCodeRepositoryMock
            .Setup(x => x.GetByIdAsync(promoCodeId))
            .ReturnsAsync(promoCode);

        _mapperMock
            .Setup(x => x.Map<PromoCodeDto>(promoCode))
            .Returns(promoCodeDto);

        // Act
        var result = await _promoCodeService.GetByIdAsync(promoCodeId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("TEST123", result.Code);
        Assert.Equal(10, result.DiscountPercent);
        _promoCodeRepositoryMock.Verify(x => x.GetByIdAsync(promoCodeId), Times.Once);
    }

    /// <summary>
    /// Test 15: Validates that GetByIdAsync throws NotFoundException for non-existent ID
    /// Scenario: Attempt to retrieve promo code with invalid ID
    /// Expected: NotFoundException
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_InvalidId_ThrowsNotFoundException()
    {
        // Arrange
        var invalidId = 999;
        _promoCodeRepositoryMock
            .Setup(x => x.GetByIdAsync(invalidId))
            .ReturnsAsync((PromoCode?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _promoCodeService.GetByIdAsync(invalidId)
        );

        Assert.Contains("not found", exception.Message.ToLower());
        Assert.Contains(invalidId.ToString(), exception.Message);
    }

    #endregion

    #region ApplyPromoCodeAsync Tests

    /// <summary>
    /// Test 16: Validates that ApplyPromoCodeAsync increments usage count
    /// Scenario: Apply promo code after successful booking
    /// Expected: Returns true indicating usage count was incremented
    /// </summary>
    [Fact]
    public async Task ApplyPromoCodeAsync_ValidPromoCode_ReturnsTrue()
    {
        // Arrange
        var promoCodeId = 1;
        _promoCodeRepositoryMock
            .Setup(x => x.IncrementUsageAsync(promoCodeId))
            .ReturnsAsync(true);

        // Act
        var result = await _promoCodeService.ApplyPromoCodeAsync(promoCodeId);

        // Assert
        Assert.True(result);
        _promoCodeRepositoryMock.Verify(x => x.IncrementUsageAsync(promoCodeId), Times.Once);
    }

    /// <summary>
    /// Test 17: Validates GetUsageCountAsync returns correct usage count
    /// Scenario: Check how many times a promo code has been used
    /// Expected: Returns correct usage count from repository
    /// </summary>
    [Fact]
    public async Task GetUsageCountAsync_ValidPromoCode_ReturnsUsageCount()
    {
        // Arrange
        var promoCodeId = 1;
        var expectedCount = 42;
        _promoCodeRepositoryMock
            .Setup(x => x.GetUsageCountAsync(promoCodeId))
            .ReturnsAsync(expectedCount);

        // Act
        var result = await _promoCodeService.GetUsageCountAsync(promoCodeId);

        // Assert
        Assert.Equal(expectedCount, result);
        _promoCodeRepositoryMock.Verify(x => x.GetUsageCountAsync(promoCodeId), Times.Once);
    }

    #endregion
}
