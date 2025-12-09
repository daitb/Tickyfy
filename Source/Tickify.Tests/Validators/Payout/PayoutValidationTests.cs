using Xunit;
using FluentAssertions;
using Tickify.Validators.Payout;
using Tickify.DTOs.Payout;

namespace Tickify.Tests.Validators.Payout;

public class PayoutValidationTests
{
    private readonly RequestPayoutValidator _validator;

    public PayoutValidationTests()
    {
        _validator = new RequestPayoutValidator();
    }

    [Fact]
    public void RequestPayoutValidator_ShouldPass_WhenDataIsValid()
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 10000000,
            BankAccountNumber = "1234567890",
            BankName = "Vietcombank",
            AccountHolderName = "Nguyen Van A"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void RequestPayoutValidator_ShouldFail_WhenEventIdIsZero()
    {
        var dto = new RequestPayoutDto
        {
            EventId = 0,
            Amount = 10000000,
            BankAccountNumber = "1234567890",
            BankName = "Vietcombank",
            AccountHolderName = "Nguyen Van A"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "EventId");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void RequestPayoutValidator_ShouldFail_WhenAmountIsInvalid(decimal amount)
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = amount,
            BankAccountNumber = "1234567890",
            BankName = "Vietcombank",
            AccountHolderName = "Nguyen Van A"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Amount");
    }

    [Fact]
    public void RequestPayoutValidator_ShouldFail_WhenAmountExceedsLimit()
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 1000000001, // Exceeds 1 billion
            BankAccountNumber = "1234567890",
            BankName = "Vietcombank",
            AccountHolderName = "Nguyen Van A"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Amount");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("1234567")] // Too short (< 8)
    [InlineData("123456789012345678901")] // Too long (> 20)
    public void RequestPayoutValidator_ShouldFail_WhenBankAccountNumberIsInvalid(string accountNumber)
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 10000000,
            BankAccountNumber = accountNumber,
            BankName = "Vietcombank",
            AccountHolderName = "Nguyen Van A"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BankAccountNumber");
    }

    [Fact]
    public void RequestPayoutValidator_ShouldFail_WhenBankAccountNumberContainsNonDigits()
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 10000000,
            BankAccountNumber = "12345ABC90",
            BankName = "Vietcombank",
            AccountHolderName = "Nguyen Van A"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BankAccountNumber");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void RequestPayoutValidator_ShouldFail_WhenBankNameIsEmpty(string bankName)
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 10000000,
            BankAccountNumber = "1234567890",
            BankName = bankName,
            AccountHolderName = "Nguyen Van A"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BankName");
    }

    [Fact]
    public void RequestPayoutValidator_ShouldFail_WhenBankNameIsTooLong()
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 10000000,
            BankAccountNumber = "1234567890",
            BankName = new string('A', 101), // 101 characters
            AccountHolderName = "Nguyen Van A"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BankName");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void RequestPayoutValidator_ShouldFail_WhenAccountHolderNameIsEmpty(string holderName)
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 10000000,
            BankAccountNumber = "1234567890",
            BankName = "Vietcombank",
            AccountHolderName = holderName
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "AccountHolderName");
    }

    [Fact]
    public void RequestPayoutValidator_ShouldFail_WhenAccountHolderNameContainsInvalidCharacters()
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 10000000,
            BankAccountNumber = "1234567890",
            BankName = "Vietcombank",
            AccountHolderName = "Nguyen123Van456"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "AccountHolderName");
    }

    [Fact]
    public void RequestPayoutValidator_ShouldPass_WhenAccountHolderNameHasVietnameseCharacters()
    {
        var dto = new RequestPayoutDto
        {
            EventId = 1,
            Amount = 10000000,
            BankAccountNumber = "1234567890",
            BankName = "Vietcombank",
            AccountHolderName = "Nguyễn Văn Ánh"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }
}
