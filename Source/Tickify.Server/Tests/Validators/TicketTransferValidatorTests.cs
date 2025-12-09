using FluentValidation.TestHelper;
using Tickify.DTOs.Ticket;
using Tickify.Validators.Ticket;
using Xunit;

namespace Tickify.Tests.Validators;

/// <summary>
/// Unit tests for TicketTransferValidator to ensure proper validation of ticket transfer requests
/// </summary>
public class TicketTransferValidatorTests
{
    private readonly TicketTransferValidator _validator;

    public TicketTransferValidatorTests()
    {
        _validator = new TicketTransferValidator();
    }

    /// <summary>
    /// Test 1: Validates that a properly formed TicketTransferDto passes all validation rules
    /// </summary>
    [Fact]
    public void Valid_TransferDto_PassesValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = "recipient@example.com",
            Message = "Here's your ticket!"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    /// <summary>
    /// Test 2: Validates that empty RecipientEmail fails validation
    /// </summary>
    [Fact]
    public void EmptyRecipientEmail_FailsValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = "",
            Message = "Here's your ticket!"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.RecipientEmail)
            .WithErrorMessage("Email người nhận là bắt buộc");
    }

    /// <summary>
    /// Test 3: Validates that invalid email format fails validation
    /// </summary>
    [Fact]
    public void InvalidEmail_FailsValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = "invalid-email-format",
            Message = "Here's your ticket!"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.RecipientEmail)
            .WithErrorMessage("Email không đúng định dạng");
    }

    /// <summary>
    /// Test 4: Validates that email longer than 255 characters fails validation
    /// </summary>
    [Fact]
    public void TooLongEmail_FailsValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = new string('a', 246) + "@email.com", // 256 characters total
            Message = "Here's your ticket!"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.RecipientEmail)
            .WithErrorMessage("Email không được dài quá 255 ký tự");
    }

    /// <summary>
    /// Test 5: Validates that message longer than 500 characters fails validation
    /// </summary>
    [Fact]
    public void TooLongMessage_FailsValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = "recipient@example.com",
            Message = new string('A', 501) // 501 characters
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Message)
            .WithErrorMessage("Tin nhắn không được dài quá 500 ký tự");
    }

    /// <summary>
    /// Test 6: Validates that null or empty message passes validation (optional field)
    /// </summary>
    [Fact]
    public void NullMessage_PassesValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = "recipient@example.com",
            Message = null
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Message);
    }

    /// <summary>
    /// Test 7: Validates that empty message passes validation (optional field)
    /// </summary>
    [Fact]
    public void EmptyMessage_PassesValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = "recipient@example.com",
            Message = ""
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Message);
    }

    /// <summary>
    /// Test 8: Validates that message at exactly 500 characters passes validation
    /// </summary>
    [Fact]
    public void MessageAtMaxLength_PassesValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = "recipient@example.com",
            Message = new string('A', 500) // Exactly 500 characters
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Message);
    }

    /// <summary>
    /// Test 9: Validates that null email fails validation
    /// </summary>
    [Fact]
    public void NullEmail_FailsValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = null!,
            Message = "Here's your ticket!"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.RecipientEmail)
            .WithErrorMessage("Email người nhận là bắt buộc");
    }

    /// <summary>
    /// Test 10: Validates that email at exactly 255 characters passes validation
    /// </summary>
    [Fact]
    public void EmailAtMaxLength_PassesValidation()
    {
        // Arrange
        var dto = new TicketTransferDto
        {
            RecipientEmail = new string('a', 245) + "@email.com", // Exactly 255 characters
            Message = "Here's your ticket!"
        };

        // Act
        var result = _validator.TestValidate(dto);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.RecipientEmail);
    }
}
