using Xunit;
using FluentAssertions;
using Tickify.Models;

namespace Tickify.Tests.Models;

public class PaymentModelTests
{
    [Fact]
    public void Payment_ShouldHaveCorrectProperties()
    {
        // Arrange & Act
        var payment = new Payment
        {
            Id = 1,
            BookingId = 100,
            Amount = 250000,
            Method = PaymentMethod.VNPay,
            Status = PaymentStatus.Completed,
            CreatedAt = DateTime.UtcNow,
            TransactionId = "TXN123456"
        };

        // Assert
        payment.Id.Should().Be(1);
        payment.BookingId.Should().Be(100);
        payment.Amount.Should().Be(250000);
        payment.Method.Should().Be(PaymentMethod.VNPay);
        payment.Status.Should().Be(PaymentStatus.Completed);
        payment.TransactionId.Should().Be("TXN123456");
    }

    [Theory]
    [InlineData(PaymentStatus.Pending)]
    [InlineData(PaymentStatus.Completed)]
    [InlineData(PaymentStatus.Failed)]
    [InlineData(PaymentStatus.Refunded)]
    public void Payment_ShouldSupportAllStatuses(PaymentStatus status)
    {
        // Arrange & Act
        var payment = new Payment { Status = status };

        // Assert
        payment.Status.Should().Be(status);
    }

    [Theory]
    [InlineData(100000)]
    [InlineData(500000)]
    [InlineData(1000000)]
    public void Payment_Amount_ShouldBePositive(decimal amount)
    {
        // Arrange & Act
        var payment = new Payment { Amount = amount };

        // Assert
        payment.Amount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Payment_ShouldLinkToBooking()
    {
        // Arrange
        var booking = new Booking { Id = 100 };
        
        // Act
        var payment = new Payment
        {
            BookingId = booking.Id,
            Booking = booking
        };

        // Assert
        payment.BookingId.Should().Be(100);
        payment.Booking.Should().NotBeNull();
        payment.Booking?.Id.Should().Be(booking.Id);
    }

    [Theory]
    [InlineData(PaymentMethod.VNPay)]
    [InlineData(PaymentMethod.Momo)]
    [InlineData(PaymentMethod.CreditCard)]
    [InlineData(PaymentMethod.BankTransfer)]
    public void Payment_ShouldSupportMultiplePaymentMethods(PaymentMethod method)
    {
        // Arrange & Act
        var payment = new Payment { Method = method };

        // Assert
        payment.Method.Should().Be(method);
    }
}
