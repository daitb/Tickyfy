using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Models;
using Tickify.Services.Email;

namespace Tickify.Jobs;

/// <summary>
/// Background job to send event reminder emails
/// Schedule: Daily at 8 AM
/// Sends reminders 24 hours before event starts
/// </summary>
public class EmailReminderJob
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailReminderJob> _logger;

    public EmailReminderJob(
        ApplicationDbContext context,
        IEmailService emailService,
        ILogger<EmailReminderJob> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task SendEventRemindersAsync()
    {
        try
        {
            _logger.LogInformation("[EmailReminderJob] Starting event reminder job at {Time}", DateTime.UtcNow);

            // Find events starting in the next 24-30 hours
            var now = DateTime.UtcNow;
            var reminderStart = now.AddHours(24);
            var reminderEnd = now.AddHours(30); // 6-hour window to catch events

            var upcomingEvents = await _context.Events
                .Include(e => e.Bookings!)
                    .ThenInclude(b => b.User)
                .Where(e => e.StartDate >= reminderStart 
                         && e.StartDate <= reminderEnd
                         && e.Status == EventStatus.Published)
                .ToListAsync();

            _logger.LogInformation("[EmailReminderJob] Found {Count} upcoming events", upcomingEvents.Count);

            var totalEmailsSent = 0;

            foreach (var evt in upcomingEvents)
            {
                if (evt.Bookings == null) continue;

                // Get confirmed bookings only
                var confirmedBookings = evt.Bookings
                    .Where(b => b.Status == BookingStatus.Confirmed && b.User != null)
                    .ToList();

                foreach (var booking in confirmedBookings)
                {
                    try
                    {
                        await SendReminderEmail(booking.User!, evt);
                        totalEmailsSent++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[EmailReminderJob] Failed to send reminder to user {UserId} for event {EventId}", 
                            booking.UserId, evt.Id);
                    }
                }
            }

            _logger.LogInformation("[EmailReminderJob] Successfully sent {Count} reminder emails", totalEmailsSent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EmailReminderJob] Error running event reminder job");
            throw; // Rethrow to let Hangfire handle retries
        }
    }

    private async Task SendReminderEmail(User user, Event evt)
    {
        var subject = $"Reminder: {evt.Title} starts tomorrow!";
        
        var templateData = new Dictionary<string, string>
        {
            { "UserName", user.FullName },
            { "EventTitle", evt.Title },
            { "EventDate", evt.StartDate.ToString("dddd, MMMM dd, yyyy") },
            { "EventTime", evt.StartDate.ToString("h:mm tt") },
            { "EventLocation", evt.Location },
            { "EventAddress", evt.Address ?? "See event details" }
        };

        await _emailService.SendEmailFromTemplateAsync(
            user.Email,
            subject,
            "EventReminder",
            templateData
        );

        _logger.LogInformation("[EmailReminderJob] Sent reminder email to {Email} for event {EventId}", 
            user.Email, evt.Id);
    }
}
