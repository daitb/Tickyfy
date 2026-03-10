using FluentValidation.TestHelper;
using Tickify.DTOs.Booking;
using Tickify.Validators.Booking;
using Xunit;

namespace Tickify.Tests.Validators;

/// <summary>
/// Unit tests for CreateBookingValidator to ensure proper validation of booking creation requests
/// </summary>
public class CreateBookingValidatorTests
{
    private readonly CreateBookingValidator _validator;

    public CreateBookingValidatorTests()
    {
        _validator = new CreateBookingValidator();
    }

    /// <summary>
    /// Test 1: Validates that a properly formed CreateBookingDto passes all validation rules
    /// </summary>
    [Fact]
    public void Valid_CreateBookingDto_PassesValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 2,
            PromoCode = "SUMMER2024",
            SeatIds = new List<int> { 1, 2 }
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    /// <summary>
    /// Test 2: Validates that EventId = 0 fails validation
    /// </summary>
    [Fact]
    public void EmptyEventId_FailsValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 0,
            TicketTypeId = 1,
            Quantity = 2
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EventId)
            .WithErrorMessage("EventId phải lớn hơn 0");
    }

    /// <summary>
    /// Test 3: Validates that empty SeatIds list when seats are selected fails validation
    /// </summary>
    [Fact]
    public void EmptySeatIds_FailsValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 2,
            SeatIds = new List<int>() // Empty list
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.SeatIds)
            .WithErrorMessage("Danh sách ghế không được rỗng nếu có chọn ghế");
    }

    /// <summary>
    /// Test 4: Validates that TicketTypeId = 0 fails validation
    /// </summary>
    [Fact]
    public void InvalidTicketTypeId_FailsValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 0,
            Quantity = 2
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.TicketTypeId)
            .WithErrorMessage("TicketTypeId phải lớn hơn 0");
    }

    /// <summary>
    /// Test 5: Validates that Quantity = 0 fails validation
    /// </summary>
    [Fact]
    public void ZeroQuantity_FailsValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 0
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Quantity)
            .WithErrorMessage("Số lượng phải lớn hơn 0");
    }

    /// <summary>
    /// Test 6: Validates that Quantity > 50 fails validation
    /// </summary>
    [Fact]
    public void ExcessiveQuantity_FailsValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 51 // Exceeds maximum of 50
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Quantity)
            .WithErrorMessage("Không được đặt quá 50 vé trong 1 lần");
    }

    /// <summary>
    /// Test 7: Validates that PromoCode longer than 50 characters fails validation
    /// </summary>
    [Fact]
    public void TooLongPromoCode_FailsValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 2,
            PromoCode = new string('A', 51) // 51 characters
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.PromoCode)
            .WithErrorMessage("Mã giảm giá không được dài quá 50 ký tự");
    }

    /// <summary>
    /// Test 8: Validates that seat count mismatch with quantity fails validation
    /// </summary>
    [Fact]
    public void SeatCountMismatch_FailsValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 3,
            SeatIds = new List<int> { 1, 2 } // Only 2 seats for 3 tickets
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.SeatIds)
            .WithErrorMessage("Số lượng ghế phải khớp với số lượng vé");
    }

    /// <summary>
    /// Test 9: Validates that null SeatIds with quantity > 0 passes validation (non-seated event)
    /// </summary>
    [Fact]
    public void NullSeatIds_PassesValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 2,
            SeatIds = null // No seat selection
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.SeatIds);
    }

    /// <summary>
    /// Test 10: Validates that null or empty PromoCode passes validation
    /// </summary>
    [Fact]
    public void NullPromoCode_PassesValidation()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            EventId = 1,
            TicketTypeId = 1,
            Quantity = 2,
            PromoCode = null
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.PromoCode);
    }
}
