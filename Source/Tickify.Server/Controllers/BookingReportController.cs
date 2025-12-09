using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using Tickify.Common;
using Tickify.Data;
using Tickify.Models;
using Microsoft.EntityFrameworkCore;

namespace Tickify.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingReportController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BookingReportController> _logger;

    public BookingReportController(
        ApplicationDbContext context,
        ILogger<BookingReportController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/bookings/report/daily - Daily bookings report (Admin only)
    /// </summary>
    [HttpGet("report/daily")]
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetDailyReport(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var bookings = await _context.Bookings
                .Include(b => b.Tickets)
                .Where(b => b.BookingDate >= start && b.BookingDate <= end)
                .ToListAsync();

            var dailyBookings = bookings
                .GroupBy(b => b.BookingDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    TotalBookings = g.Count(),
                    ConfirmedBookings = g.Count(b => b.Status == BookingStatus.Confirmed),
                    PendingBookings = g.Count(b => b.Status == BookingStatus.Pending),
                    CancelledBookings = g.Count(b => b.Status == BookingStatus.Cancelled),
                    TotalRevenue = g.Where(b => b.Status == BookingStatus.Confirmed)
                                    .Sum(b => b.TotalAmount),
                    TotalTickets = g.Sum(b => b.Tickets?.Count ?? 0)
                })
                .OrderBy(x => x.Date)
                .ToList();

            var summary = new
            {
                StartDate = start,
                EndDate = end,
                TotalDays = dailyBookings.Count,
                TotalBookings = dailyBookings.Sum(x => x.TotalBookings),
                TotalRevenue = dailyBookings.Sum(x => x.TotalRevenue),
                TotalTickets = dailyBookings.Sum(x => x.TotalTickets),
                DailyData = dailyBookings
            };

            return Ok(ApiResponse<object>.SuccessResponse(summary));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[BookingReportController] Error generating daily report");
            return StatusCode(500, ApiResponse<object>.FailureResponse("Error generating daily report"));
        }
    }

    /// <summary>
    /// GET /api/bookings/report/monthly - Monthly bookings report (Admin only)
    /// </summary>
    [HttpGet("report/monthly")]
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetMonthlyReport([FromQuery] int? year = null)
    {
        try
        {
            var reportYear = year ?? DateTime.UtcNow.Year;

            var bookings = await _context.Bookings
                .Include(b => b.Tickets)
                .Where(b => b.BookingDate.Year == reportYear)
                .ToListAsync();

            var monthlyBookings = bookings
                .GroupBy(b => b.BookingDate.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    MonthName = new DateTime(reportYear, g.Key, 1).ToString("MMMM"),
                    TotalBookings = g.Count(),
                    ConfirmedBookings = g.Count(b => b.Status == BookingStatus.Confirmed),
                    TotalRevenue = g.Where(b => b.Status == BookingStatus.Confirmed).Sum(b => b.TotalAmount),
                    TotalTickets = g.Sum(b => b.Tickets?.Count ?? 0)
                })
                .OrderBy(x => x.Month)
                .ToList();

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                Year = reportYear,
                MonthlyData = monthlyBookings
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[BookingReportController] Error generating monthly report");
            return StatusCode(500, ApiResponse<object>.FailureResponse("Error generating monthly report"));
        }
    }

    /// <summary>
    /// GET /api/bookings/report/by-event - Bookings by event report
    /// </summary>
    [HttpGet("report/by-event")]
    [Authorize(Roles = "Admin,Staff,Organizer")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetByEventReport([FromQuery] int? eventId = null)
    {
        try
        {
            var query = _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.Tickets)
                .AsQueryable();

            if (eventId.HasValue)
            {
                query = query.Where(b => b.EventId == eventId.Value);
            }

            var bookings = await query.ToListAsync();

            var eventBookings = bookings
                .GroupBy(b => new { b.EventId, b.Event?.Title })
                .Select(g => new
                {
                    EventId = g.Key.EventId,
                    EventName = g.Key.Title ?? "Unknown",
                    TotalBookings = g.Count(),
                    ConfirmedBookings = g.Count(b => b.Status == BookingStatus.Confirmed),
                    TotalRevenue = g.Where(b => b.Status == BookingStatus.Confirmed).Sum(b => b.TotalAmount),
                    TotalTickets = g.Sum(b => b.Tickets?.Count ?? 0)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .ToList();

            return Ok(ApiResponse<object>.SuccessResponse(new { EventData = eventBookings }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[BookingReportController] Error generating by-event report");
            return StatusCode(500, ApiResponse<object>.FailureResponse("Error generating by-event report"));
        }
    }

    /// <summary>
    /// GET /api/bookings/report/cancellations - Cancellation report (Admin only)
    /// </summary>
    [HttpGet("report/cancellations")]
    [Authorize(Roles = "Admin,Staff")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetCancellationsReport(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var cancellations = await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.User)
                .Include(b => b.Tickets)
                .Where(b => b.Status == BookingStatus.Cancelled 
                         && b.BookingDate >= start 
                         && b.BookingDate <= end)
                .Select(b => new
                {
                    BookingId = b.Id,
                    EventName = b.Event!.Title,
                    UserEmail = b.User!.Email,
                    BookingDate = b.BookingDate,
                    CancelledDate = b.CancelledAt,
                    Amount = b.TotalAmount,
                    TicketQuantity = b.Tickets != null ? b.Tickets.Count : 0,
                    CancellationReason = b.CancellationReason ?? "Not specified"
                })
                .OrderByDescending(x => x.CancelledDate)
                .ToListAsync();

            var summary = new
            {
                StartDate = start,
                EndDate = end,
                TotalCancellations = cancellations.Count,
                TotalRefundedAmount = cancellations.Sum(x => x.Amount),
                CancellationDetails = cancellations
            };

            return Ok(ApiResponse<object>.SuccessResponse(summary));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[BookingReportController] Error generating cancellations report");
            return StatusCode(500, ApiResponse<object>.FailureResponse("Error generating cancellations report"));
        }
    }

    /// <summary>
    /// GET /api/bookings/export - Export bookings to CSV (Admin only)
    /// </summary>
    [HttpGet("export")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> ExportBookings(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var query = _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.User)
                .Include(b => b.Tickets)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(b => b.BookingDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(b => b.BookingDate <= endDate.Value);

            var bookings = await query
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    BookingId = b.Id,
                    BookingDate = b.BookingDate,
                    EventName = b.Event!.Title,
                    UserEmail = b.User!.Email,
                    UserName = b.User.FullName,
                    Status = b.Status,
                    TicketQuantity = b.Tickets != null ? b.Tickets.Count : 0,
                    TotalAmount = b.TotalAmount
                })
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("Booking ID,Booking Date,Event Name,User Email,User Name,Status,Ticket Quantity,Total Amount");

            foreach (var booking in bookings)
            {
                csv.AppendLine($"{booking.BookingId}," +
                             $"{booking.BookingDate:yyyy-MM-dd HH:mm:ss}," +
                             $"\"{booking.EventName}\"," +
                             $"{booking.UserEmail}," +
                             $"\"{booking.UserName}\"," +
                             $"{booking.Status}," +
                             $"{booking.TicketQuantity}," +
                             $"{booking.TotalAmount}");
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"bookings_{DateTime.UtcNow:yyyyMMdd}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[BookingReportController] Error exporting bookings");
            return StatusCode(500);
        }
    }
}
