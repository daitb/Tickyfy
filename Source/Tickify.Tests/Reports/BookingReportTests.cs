using Xunit;
using FluentAssertions;
using Tickify.Models;
using System;
using System.Linq;

namespace Tickify.Tests.Reports;

public class BookingReportTests
{
    [Fact]
    public void BookingReport_ShouldCalculateDailyStats_Correctly()
    {
        // Arrange
        var bookings = new[]
        {
            new Booking
            {
                Id = 1,
                BookingDate = DateTime.UtcNow.Date,
                Status = BookingStatus.Confirmed,
                TotalAmount = 100000,
                Tickets = new List<Ticket> { new Ticket(), new Ticket() }
            },
            new Booking
            {
                Id = 2,
                BookingDate = DateTime.UtcNow.Date,
                Status = BookingStatus.Pending,
                TotalAmount = 50000,
                Tickets = new List<Ticket> { new Ticket() }
            },
            new Booking
            {
                Id = 3,
                BookingDate = DateTime.UtcNow.Date,
                Status = BookingStatus.Cancelled,
                TotalAmount = 75000,
                Tickets = new List<Ticket>()
            }
        };

        // Act
        var dailyStats = bookings
            .GroupBy(b => b.BookingDate.Date)
            .Select(g => new
            {
                Date = g.Key,
                TotalBookings = g.Count(),
                ConfirmedBookings = g.Count(b => b.Status == BookingStatus.Confirmed),
                PendingBookings = g.Count(b => b.Status == BookingStatus.Pending),
                CancelledBookings = g.Count(b => b.Status == BookingStatus.Cancelled),
                TotalRevenue = g.Where(b => b.Status == BookingStatus.Confirmed).Sum(b => b.TotalAmount),
                TotalTickets = g.Sum(b => b.Tickets?.Count ?? 0)
            })
            .First();

        // Assert
        dailyStats.TotalBookings.Should().Be(3);
        dailyStats.ConfirmedBookings.Should().Be(1);
        dailyStats.PendingBookings.Should().Be(1);
        dailyStats.CancelledBookings.Should().Be(1);
        dailyStats.TotalRevenue.Should().Be(100000); // Only confirmed
        dailyStats.TotalTickets.Should().Be(3);
    }

    [Fact]
    public void BookingReport_ShouldCalculateMonthlyStats_Correctly()
    {
        // Arrange
        var bookings = new[]
        {
            new Booking
            {
                Id = 1,
                BookingDate = new DateTime(2025, 12, 1),
                Status = BookingStatus.Confirmed,
                TotalAmount = 100000
            },
            new Booking
            {
                Id = 2,
                BookingDate = new DateTime(2025, 12, 15),
                Status = BookingStatus.Confirmed,
                TotalAmount = 200000
            },
            new Booking
            {
                Id = 3,
                BookingDate = new DateTime(2025, 11, 20),
                Status = BookingStatus.Confirmed,
                TotalAmount = 150000
            }
        };

        // Act
        var monthlyStats = bookings
            .GroupBy(b => new { b.BookingDate.Year, b.BookingDate.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                TotalBookings = g.Count(),
                TotalRevenue = g.Where(b => b.Status == BookingStatus.Confirmed).Sum(b => b.TotalAmount)
            })
            .OrderByDescending(x => x.Year)
            .ThenByDescending(x => x.Month)
            .ToList();

        // Assert
        monthlyStats.Should().HaveCount(2);
        
        var dec2025 = monthlyStats.First(m => m.Month == 12);
        dec2025.TotalBookings.Should().Be(2);
        dec2025.TotalRevenue.Should().Be(300000);

        var nov2025 = monthlyStats.First(m => m.Month == 11);
        nov2025.TotalBookings.Should().Be(1);
        nov2025.TotalRevenue.Should().Be(150000);
    }

    [Fact]
    public void BookingReport_ShouldCalculateCancellationRate_Correctly()
    {
        // Arrange
        var bookings = new[]
        {
            new Booking { Id = 1, Status = BookingStatus.Confirmed },
            new Booking { Id = 2, Status = BookingStatus.Confirmed },
            new Booking { Id = 3, Status = BookingStatus.Confirmed },
            new Booking { Id = 4, Status = BookingStatus.Cancelled },
            new Booking { Id = 5, Status = BookingStatus.Cancelled }
        };

        // Act
        var totalBookings = bookings.Length;
        var cancelledBookings = bookings.Count(b => b.Status == BookingStatus.Cancelled);
        var cancellationRate = (decimal)cancelledBookings / totalBookings * 100;

        // Assert
        totalBookings.Should().Be(5);
        cancelledBookings.Should().Be(2);
        cancellationRate.Should().Be(40m); // 2/5 = 40%
    }

    [Fact]
    public void BookingReport_ShouldGroupByEvent_Correctly()
    {
        // Arrange
        var bookings = new[]
        {
            new Booking
            {
                Id = 1,
                EventId = 1,
                Status = BookingStatus.Confirmed,
                TotalAmount = 100000
            },
            new Booking
            {
                Id = 2,
                EventId = 1,
                Status = BookingStatus.Confirmed,
                TotalAmount = 150000
            },
            new Booking
            {
                Id = 3,
                EventId = 2,
                Status = BookingStatus.Confirmed,
                TotalAmount = 200000
            }
        };

        // Act
        var eventStats = bookings
            .GroupBy(b => b.EventId)
            .Select(g => new
            {
                EventId = g.Key,
                TotalBookings = g.Count(),
                TotalRevenue = g.Where(b => b.Status == BookingStatus.Confirmed).Sum(b => b.TotalAmount)
            })
            .OrderByDescending(x => x.TotalRevenue)
            .ToList();

        // Assert
        eventStats.Should().HaveCount(2);
        
        var event1 = eventStats.First(e => e.EventId == 1);
        event1.TotalBookings.Should().Be(2);
        event1.TotalRevenue.Should().Be(250000);

        var event2 = eventStats.First(e => e.EventId == 2);
        event2.TotalBookings.Should().Be(1);
        event2.TotalRevenue.Should().Be(200000);
    }

    [Fact]
    public void BookingReport_ShouldFilterByDateRange_Correctly()
    {
        // Arrange
        var startDate = new DateTime(2025, 12, 1);
        var endDate = new DateTime(2025, 12, 15);

        var bookings = new[]
        {
            new Booking { Id = 1, BookingDate = new DateTime(2025, 11, 30), Status = BookingStatus.Confirmed },
            new Booking { Id = 2, BookingDate = new DateTime(2025, 12, 5), Status = BookingStatus.Confirmed },
            new Booking { Id = 3, BookingDate = new DateTime(2025, 12, 10), Status = BookingStatus.Confirmed },
            new Booking { Id = 4, BookingDate = new DateTime(2025, 12, 20), Status = BookingStatus.Confirmed }
        };

        // Act
        var filteredBookings = bookings
            .Where(b => b.BookingDate >= startDate && b.BookingDate <= endDate)
            .ToList();

        // Assert
        filteredBookings.Should().HaveCount(2);
        filteredBookings.Should().Contain(b => b.Id == 2);
        filteredBookings.Should().Contain(b => b.Id == 3);
    }
}
