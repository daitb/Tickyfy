using System.Collections.Generic;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Event;
using Tickify.DTOs.Organizer;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Services.Email;

namespace Tickify.Services;

/// <summary>
/// Organizer Service - Business logic for organizer management
/// </summary>
public class OrganizerService : IOrganizerService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrganizerService> _logger;

    public OrganizerService(
        ApplicationDbContext context,
        IEmailService emailService,
        ILogger<OrganizerService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Register new organizer (User becomes Organizer)
    /// </summary>
    public async Task<OrganizerDto> RegisterOrganizerAsync(int userId, CreateOrganizerDto dto)
    {
        _logger.LogInformation("Registering user {UserId} as organizer", userId);

        // Check if user exists
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found");
        }

        // Check if user is already an organizer
        var existingOrganizer = await _context.Organizers
            .FirstOrDefaultAsync(o => o.UserId == userId);

        if (existingOrganizer != null)
        {
            throw new ConflictException("User is already registered as an organizer");
        }

        // Create organizer profile
        var organizer = new Organizer
        {
            UserId = userId,
            CompanyName = dto.CompanyName,
            BusinessRegistrationNumber = dto.BusinessRegistrationNumber,
            TaxCode = dto.TaxCode,
            CompanyAddress = dto.CompanyAddress,
            CompanyPhone = dto.CompanyPhone,
            CompanyEmail = dto.CompanyEmail,
            Website = dto.Website,
            Description = dto.Description,
            IsVerified = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Organizers.Add(organizer);

        // Assign Organizer role to user
        var organizerRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == "Organizer");

        if (organizerRole != null)
        {
            var userRole = new UserRole
            {
                UserId = userId,
                RoleId = organizerRole.Id,
                AssignedAt = DateTime.UtcNow
            };
            _context.UserRoles.Add(userRole);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Organizer registered successfully with ID: {OrganizerId}", organizer.Id);

        // Send welcome email
        try
        {
            await _emailService.SendOrganizerWelcomeEmailAsync(user.Email, user.FullName, organizer.CompanyName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send organizer welcome email to {Email}", user.Email);
        }

        return MapToOrganizerDto(organizer);
    }

    /// <summary>
    /// Get organizer profile by ID
    /// </summary>
    public async Task<OrganizerProfileDto?> GetOrganizerProfileAsync(int organizerId)
    {
        _logger.LogInformation("Fetching organizer profile for ID: {OrganizerId}", organizerId);

        var organizer = await _context.Organizers
            .Include(o => o.User)
            .Include(o => o.Events)
            .FirstOrDefaultAsync(o => o.Id == organizerId);

        if (organizer == null)
        {
            return null;
        }

        var totalEvents = organizer.Events?.Count ?? 0;
        var publishedEvents = organizer.Events?.Count(e => e.Status == EventStatus.Published) ?? 0;

        return new OrganizerProfileDto
        {
            OrganizerId = organizer.Id,
            UserId = organizer.UserId,
            UserName = organizer.User?.FullName ?? "Unknown",
            UserEmail = organizer.User?.Email ?? "Unknown",
            CompanyName = organizer.CompanyName,
            BusinessRegistrationNumber = organizer.BusinessRegistrationNumber,
            TaxCode = organizer.TaxCode,
            CompanyAddress = organizer.CompanyAddress,
            CompanyPhone = organizer.CompanyPhone,
            CompanyEmail = organizer.CompanyEmail,
            Website = organizer.Website,
            Logo = organizer.Logo,
            Description = organizer.Description,
            IsVerified = organizer.IsVerified,
            VerifiedAt = organizer.VerifiedAt,
            TotalEvents = totalEvents,
            PublishedEvents = publishedEvents,
            CreatedAt = organizer.CreatedAt,
            UpdatedAt = organizer.UpdatedAt
        };
    }

    /// <summary>
    /// Update organizer profile
    /// </summary>
    public async Task<OrganizerProfileDto> UpdateOrganizerProfileAsync(int organizerId, int userId, CreateOrganizerDto dto)
    {
        _logger.LogInformation("Updating organizer profile ID: {OrganizerId}", organizerId);

        var organizer = await _context.Organizers
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == organizerId);

        if (organizer == null)
        {
            throw new NotFoundException($"Organizer with ID {organizerId} not found");
        }

        // Verify ownership
        if (organizer.UserId != userId)
        {
            throw new ForbiddenException("You don't have permission to update this organizer profile");
        }

        // Update fields
        organizer.CompanyName = dto.CompanyName;
        organizer.BusinessRegistrationNumber = dto.BusinessRegistrationNumber;
        organizer.TaxCode = dto.TaxCode;
        organizer.CompanyAddress = dto.CompanyAddress;
        organizer.CompanyPhone = dto.CompanyPhone;
        organizer.CompanyEmail = dto.CompanyEmail;
        organizer.Website = dto.Website;
        organizer.Description = dto.Description;
        organizer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Organizer profile {OrganizerId} updated successfully", organizerId);

        return (await GetOrganizerProfileAsync(organizerId))!;
    }

    /// <summary>
    /// Get all events for an organizer
    /// </summary>
    public async Task<List<OrganizerEventDashboardDto>> GetOrganizerEventsAsync(int organizerId, int userId)
    {
        _logger.LogInformation("Fetching events for organizer ID: {OrganizerId}", organizerId);

        var organizer = await _context.Organizers
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == organizerId);

        if (organizer == null)
        {
            throw new NotFoundException($"Organizer with ID {organizerId} not found");
        }

        var isAdminRequest = userId == 0;

        // Verify ownership when request comes from organizer context
        if (!isAdminRequest && organizer.UserId != userId)
        {
            throw new ForbiddenException("You don't have permission to view these events");
        }

        var events = await _context.Events
            .AsNoTracking()
            .Where(e => e.OrganizerId == organizerId)
            .OrderByDescending(e => e.StartDate)
            .Select(e => new OrganizerEventDashboardDto
            {
                EventId = e.Id,
                Title = e.Title,
                StartDate = e.StartDate,
                Status = e.Status.ToString(),
                TotalSeats = e.TicketTypes!
                    .Select(tt => (int?)tt.TotalQuantity)
                    .Sum() ?? 0,
                SoldSeats = e.TicketTypes!
                    .Select(tt => (int?)(tt.TotalQuantity - tt.AvailableQuantity))
                    .Sum() ?? 0,
                Revenue = e.Bookings!
                    .Where(b => b.Status == BookingStatus.Confirmed
                                && b.Payment != null
                                && b.Payment.Status == PaymentStatus.Completed)
                    .Select(b => (decimal?)b.Payment!.Amount)
                    .Sum() ?? 0m
            })
            .ToListAsync();

        return events;
    }

    /// <summary>
    /// Get organizer earnings dashboard
    /// </summary>
    public async Task<OrganizerEarningsDto> GetOrganizerEarningsAsync(int organizerId, int userId)
    {
        _logger.LogInformation("Fetching earnings for organizer ID: {OrganizerId}", organizerId);

        var organizer = await _context.Organizers.FindAsync(organizerId);

        if (organizer == null)
        {
            throw new NotFoundException($"Organizer with ID {organizerId} not found");
        }

        var isAdminRequest = userId == 0;

        // Verify ownership
        if (!isAdminRequest && organizer.UserId != userId)
        {
            throw new ForbiddenException("You don't have permission to view these earnings");
        }

        var completedPaymentQuery = _context.Payments
            .AsNoTracking()
            .Where(p =>
                p.Status == PaymentStatus.Completed &&
                p.Booking != null &&
                p.Booking.Event != null &&
                p.Booking.Event.OrganizerId == organizerId);

        var totalRevenue = await completedPaymentQuery
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var totalTicketsSold = await _context.Tickets
            .AsNoTracking()
            .Where(t =>
                t.Booking != null &&
                t.Booking.Event != null &&
                t.Booking.Event.OrganizerId == organizerId &&
                t.Booking.Status == BookingStatus.Confirmed &&
                t.Status != TicketStatus.Cancelled &&
                t.Status != TicketStatus.Refunded)
            .CountAsync();

        const decimal platformFeeRate = 0.10m;
        var platformFees = Math.Round(totalRevenue * platformFeeRate, 2, MidpointRounding.AwayFromZero);
        var netEarnings = totalRevenue - platformFees;

        var completedStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Processed",
            "Completed"
        };
        var pendingStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Pending",
            "Approved"
        };

        var completedPayouts = await _context.Payouts
            .AsNoTracking()
            .Where(p => p.OrganizerId == organizerId && completedStatuses.Contains(p.Status))
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var pendingPayouts = await _context.Payouts
            .AsNoTracking()
            .Where(p => p.OrganizerId == organizerId && pendingStatuses.Contains(p.Status))
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var availableBalance = netEarnings - completedPayouts - pendingPayouts;

        var monthlyRevenue = await completedPaymentQuery
            .Where(p => p.PaidAt.HasValue)
            .GroupBy(p => new { p.PaidAt!.Value.Year, p.PaidAt.Value.Month })
            .OrderBy(g => g.Key.Year)
            .ThenBy(g => g.Key.Month)
            .Select(g => new OrganizerMonthlyRevenueDto
            {
                Month = new DateTime(g.Key.Year, g.Key.Month, 1)
                    .ToString("MMM yyyy", CultureInfo.InvariantCulture),
                Revenue = g.Sum(p => p.Amount),
                TicketsSold = g.SelectMany(p => p.Booking!.Tickets!)
                    .Count(t => t.Status != TicketStatus.Cancelled && t.Status != TicketStatus.Refunded)
            })
            .ToListAsync();

        var topEvents = await _context.Events
            .AsNoTracking()
            .Where(e => e.OrganizerId == organizerId)
            .Select(e => new OrganizerTopEventDto
            {
                EventId = e.Id,
                Title = e.Title,
                Revenue = e.Bookings!
                    .Where(b => b.Status == BookingStatus.Confirmed
                                && b.Payment != null
                                && b.Payment.Status == PaymentStatus.Completed)
                    .Select(b => (decimal?)b.Payment!.Amount)
                    .Sum() ?? 0m,
                TicketsSold = e.Bookings!
                    .Where(b => b.Status == BookingStatus.Confirmed)
                    .SelectMany(b => b.Tickets!)
                    .Count(t => t.Status != TicketStatus.Cancelled && t.Status != TicketStatus.Refunded)
            })
            .OrderByDescending(e => e.Revenue)
            .ThenByDescending(e => e.TicketsSold)
            .Take(5)
            .ToListAsync();

        return new OrganizerEarningsDto
        {
            TotalRevenue = totalRevenue,
            TotalPlatformFee = platformFees,
            NetEarnings = netEarnings,
            CompletedPayouts = completedPayouts,
            PendingPayouts = pendingPayouts,
            AvailableBalance = availableBalance,
            TotalTicketsSold = totalTicketsSold,
            MonthlyRevenue = monthlyRevenue,
            TopEvents = topEvents
        };
    }

    /// <summary>
    /// Verify organizer (Admin only)
    /// </summary>
    public async Task<OrganizerDto> VerifyOrganizerAsync(int organizerId, int adminId)
    {
        _logger.LogInformation("Admin {AdminId} verifying organizer {OrganizerId}", adminId, organizerId);

        var organizer = await _context.Organizers
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == organizerId);

        if (organizer == null)
        {
            throw new NotFoundException($"Organizer with ID {organizerId} not found");
        }

        if (organizer.IsVerified)
        {
            throw new BadRequestException("Organizer is already verified");
        }

        organizer.IsVerified = true;
        organizer.VerifiedByStaffId = adminId;
        organizer.VerifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Organizer {OrganizerId} verified successfully", organizerId);

        // Send verification email
        if (organizer.User != null)
        {
            try
            {
                await _emailService.SendOrganizerVerificationEmailAsync(
                    organizer.User.Email,
                    organizer.User.FullName,
                    organizer.CompanyName
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send organizer verification email to {Email}", organizer.User.Email);
            }
        }

        return MapToOrganizerDto(organizer);
    }

    /// <summary>
    /// Get all organizers (Admin only)
    /// </summary>
    public async Task<List<OrganizerDto>> GetAllOrganizersAsync()
    {
        _logger.LogInformation("Fetching all organizers");

        var organizers = await _context.Organizers
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return organizers.Select(MapToOrganizerDto).ToList();
    }

    #region Helper Methods

    private OrganizerDto MapToOrganizerDto(Organizer organizer)
    {
        return new OrganizerDto
        {
            OrganizerId = organizer.Id,
            UserId = organizer.UserId,
            CompanyName = organizer.CompanyName,
            Description = organizer.Description,
            Website = organizer.Website,
            PhoneNumber = organizer.CompanyPhone,
            IsVerified = organizer.IsVerified,
            CreatedAt = organizer.CreatedAt
        };
    }

    #endregion
}
