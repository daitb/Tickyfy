using FluentValidation.TestHelper;
using Tickify.DTOs.SeatMap;
using Tickify.Validators.SeatMap;
using Xunit;

namespace Tickify.Tests.Validators;

/// <summary>
/// Unit tests for CreateSeatZoneValidator to ensure proper validation of seat zone creation requests
/// </summary>
public class CreateSeatZoneValidatorTests
{
    private readonly CreateSeatZoneValidator _validator;

    public CreateSeatZoneValidatorTests()
    {
        _validator = new CreateSeatZoneValidator();
    }

    /// <summary>
    /// Test 1: Validates that a properly formed CreateSeatZoneDto passes all validation rules
    /// </summary>
    [Fact]
    public void Valid_SeatZoneDto_PassesValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            Color = "#FFD700",
            Description = "Premium seating area",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    /// <summary>
    /// Test 2: Validates that SeatMapId = 0 fails validation
    /// </summary>
    [Fact]
    public void EmptySeatMapId_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 0,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.SeatMapId)
            .WithErrorMessage("SeatMapId phải lớn hơn 0");
    }

    /// <summary>
    /// Test 3: Validates that TicketTypeId = 0 fails validation
    /// </summary>
    [Fact]
    public void EmptyTicketTypeId_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 0,
            Name = "VIP Section",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.TicketTypeId)
            .WithErrorMessage("TicketTypeId phải lớn hơn 0");
    }

    /// <summary>
    /// Test 4: Validates that empty Name fails validation
    /// </summary>
    [Fact]
    public void EmptyZoneName_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Tên khu vực là bắt buộc");
    }

    /// <summary>
    /// Test 5: Validates that Name longer than 100 characters fails validation
    /// </summary>
    [Fact]
    public void TooLongZoneName_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = new string('A', 101), // 101 characters
            StartRow = 1,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Tên khu vực không được dài quá 100 ký tự");
    }

    /// <summary>
    /// Test 6: Validates that StartRow > EndRow fails validation
    /// </summary>
    [Fact]
    public void InvalidRowRange_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 10,
            EndRow = 5, // EndRow < StartRow
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EndRow)
            .WithErrorMessage("Hàng kết thúc phải lớn hơn hoặc bằng hàng bắt đầu");
    }

    /// <summary>
    /// Test 7: Validates that StartColumn > EndColumn fails validation
    /// </summary>
    [Fact]
    public void InvalidColumnRange_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 20,
            EndColumn = 10, // EndColumn < StartColumn
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EndColumn)
            .WithErrorMessage("Cột kết thúc phải lớn hơn hoặc bằng cột bắt đầu");
    }

    /// <summary>
    /// Test 8: Validates that StartRow = 0 fails validation
    /// </summary>
    [Fact]
    public void ZeroStartRow_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 0,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.StartRow)
            .WithErrorMessage("Hàng bắt đầu phải lớn hơn 0");
    }

    /// <summary>
    /// Test 9: Validates that EndRow = 0 fails validation
    /// </summary>
    [Fact]
    public void ZeroEndRow_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 1,
            EndRow = 0,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EndRow)
            .WithErrorMessage("Hàng kết thúc phải lớn hơn 0");
    }

    /// <summary>
    /// Test 10: Validates that StartColumn = 0 fails validation
    /// </summary>
    [Fact]
    public void ZeroStartColumn_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 0,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.StartColumn)
            .WithErrorMessage("Cột bắt đầu phải lớn hơn 0");
    }

    /// <summary>
    /// Test 11: Validates that EndColumn = 0 fails validation
    /// </summary>
    [Fact]
    public void ZeroEndColumn_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 0,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EndColumn)
            .WithErrorMessage("Cột kết thúc phải lớn hơn 0");
    }

    /// <summary>
    /// Test 12: Validates that negative ZonePrice fails validation
    /// </summary>
    [Fact]
    public void NegativeZonePrice_FailsValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = -100m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.ZonePrice)
            .WithErrorMessage("Giá khu vực phải lớn hơn hoặc bằng 0");
    }

    /// <summary>
    /// Test 13: Validates that ZonePrice = 0 passes validation (free zone)
    /// </summary>
    [Fact]
    public void ZeroZonePrice_PassesValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "Free Section",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 0m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.ZonePrice);
    }

    /// <summary>
    /// Test 14: Validates that StartRow = EndRow passes validation (single row zone)
    /// </summary>
    [Fact]
    public void SingleRowZone_PassesValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 5,
            EndRow = 5, // Same row
            StartColumn = 1,
            EndColumn = 10,
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.EndRow);
    }

    /// <summary>
    /// Test 15: Validates that StartColumn = EndColumn passes validation (single column zone)
    /// </summary>
    [Fact]
    public void SingleColumnZone_PassesValidation()
    {
        // Arrange
        var dto = new CreateSeatZoneDto
        {
            SeatMapId = 1,
            TicketTypeId = 1,
            Name = "VIP Section",
            StartRow = 1,
            EndRow = 5,
            StartColumn = 10,
            EndColumn = 10, // Same column
            ZonePrice = 500000m
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.EndColumn);
    }
}
