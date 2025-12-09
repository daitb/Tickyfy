using FluentValidation.TestHelper;
using Tickify.DTOs.PromoCode;
using Tickify.Validators.PromoCode;
using Xunit;

namespace Tickify.Tests.Validators;

/// <summary>
/// Unit tests for ValidatePromoCodeValidator to ensure proper validation of promo code validation requests
/// </summary>
public class ValidatePromoCodeValidatorTests
{
    private readonly ValidatePromoCodeValidator _validator;

    public ValidatePromoCodeValidatorTests()
    {
        _validator = new ValidatePromoCodeValidator();
    }

    /// <summary>
    /// Test 1: Validates that a properly formed ValidatePromoCodeDto passes all validation rules
    /// </summary>
    [Fact]
    public void Valid_PromoCodeDto_PassesValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "SUMMER2024",
            EventId = 1,
            OrderTotal = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    /// <summary>
    /// Test 2: Validates that empty Code fails validation
    /// </summary>
    [Fact]
    public void EmptyCode_FailsValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "",
            EventId = 1,
            OrderTotal = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Code)
            .WithErrorMessage("Mã giảm giá là bắt buộc");
    }

    /// <summary>
    /// Test 3: Validates that null Code fails validation
    /// </summary>
    [Fact]
    public void NullCode_FailsValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = null!,
            EventId = 1,
            OrderTotal = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Code)
            .WithErrorMessage("Mã giảm giá là bắt buộc");
    }

    /// <summary>
    /// Test 4: Validates that Code longer than 50 characters fails validation
    /// </summary>
    [Fact]
    public void TooLongCode_FailsValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = new string('A', 51), // 51 characters
            EventId = 1,
            OrderTotal = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Code)
            .WithErrorMessage("Mã giảm giá không được dài quá 50 ký tự");
    }

    /// <summary>
    /// Test 5: Validates that Code at exactly 50 characters passes validation
    /// </summary>
    [Fact]
    public void CodeAtMaxLength_PassesValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = new string('A', 50), // Exactly 50 characters
            EventId = 1,
            OrderTotal = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Code);
    }

    /// <summary>
    /// Test 6: Validates that EventId = 0 fails validation
    /// </summary>
    [Fact]
    public void ZeroEventId_FailsValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "SUMMER2024",
            EventId = 0,
            OrderTotal = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EventId)
            .WithErrorMessage("EventId phải lớn hơn 0");
    }

    /// <summary>
    /// Test 7: Validates that negative EventId fails validation
    /// </summary>
    [Fact]
    public void NegativeEventId_FailsValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "SUMMER2024",
            EventId = -1,
            OrderTotal = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EventId)
            .WithErrorMessage("EventId phải lớn hơn 0");
    }

    /// <summary>
    /// Test 8: Validates that negative OrderTotal fails validation
    /// </summary>
    [Fact]
    public void NegativeOrderTotal_FailsValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "SUMMER2024",
            EventId = 1,
            OrderTotal = -100m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.OrderTotal)
            .WithErrorMessage("Tổng giá trị đơn hàng phải lớn hơn hoặc bằng 0");
    }

    /// <summary>
    /// Test 9: Validates that OrderTotal = 0 passes validation
    /// </summary>
    [Fact]
    public void ZeroOrderTotal_PassesValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "SUMMER2024",
            EventId = 1,
            OrderTotal = 0m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.OrderTotal);
    }

    /// <summary>
    /// Test 10: Validates that very large OrderTotal passes validation
    /// </summary>
    [Fact]
    public void LargeOrderTotal_PassesValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "SUMMER2024",
            EventId = 1,
            OrderTotal = 999999999m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.OrderTotal);
    }

    /// <summary>
    /// Test 11: Validates that whitespace-only Code fails validation
    /// </summary>
    [Fact]
    public void WhitespaceCode_FailsValidation()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "   ",
            EventId = 1,
            OrderTotal = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Code)
            .WithErrorMessage("Mã giảm giá là bắt buộc");
    }

    /// <summary>
    /// Test 12: Validates multiple validation errors at once
    /// </summary>
    [Fact]
    public void MultipleValidationErrors_ReturnsAllErrors()
    {
        // Arrange
        var dto = new ValidatePromoCodeDto
        {
            Code = "",
            EventId = 0,
            OrderTotal = -100m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Code);
        result.ShouldHaveValidationErrorFor(x => x.EventId);
        result.ShouldHaveValidationErrorFor(x => x.OrderTotal);
    }
}
