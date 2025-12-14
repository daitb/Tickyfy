using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Admin;
using Tickify.DTOs.Event;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Services.Email;
using System.Globalization;

namespace Tickify.Services;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AdminService> _logger;

    public AdminService(
        ApplicationDbContext context,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IUserRoleRepository userRoleRepository,
        IEmailService emailService,
        INotificationService notificationService,
        ILogger<AdminService> logger)
    {
        _context = context;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _emailService = emailService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<List<OrganizerRequest>> GetAllOrganizerRequestsAsync()
    {
        return await _context.OrganizerRequests
            .Include(r => r.User)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
    }

    public async Task<OrganizerRequest?> GetOrganizerRequestByIdAsync(int requestId)
    {
        return await _context.OrganizerRequests
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);
    }

    public async Task<OrganizerRequest> ApproveOrganizerRequestAsync(int requestId, int adminId)
    {
        var request = await _context.OrganizerRequests
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
            throw new NotFoundException($"Organizer request with ID {requestId} not found");

        if (request.Status != "Pending")
            throw new BadRequestException($"Request is already {request.Status}");

        var existingOrganizer = await _context.Organizers
            .FirstOrDefaultAsync(o => o.UserId == request.UserId);

        if (existingOrganizer != null)
            throw new ConflictException("User is already an organizer");

        var organizer = new Organizer
        {
            UserId = request.UserId,
            CompanyName = request.OrganizationName,
            BusinessRegistrationNumber = request.BusinessRegistration,
            CompanyAddress = request.Address,
            CompanyPhone = request.PhoneNumber,
            Description = request.Description,
            IsVerified = true,
            VerifiedAt = DateTime.UtcNow,
            VerifiedByStaffId = adminId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Organizers.Add(organizer);

        var organizerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Organizer");
        if (organizerRole != null)
        {
            var existingUserRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == request.UserId && ur.RoleId == organizerRole.Id);

            if (existingUserRole == null)
            {
                var userRole = new UserRole
                {
                    UserId = request.UserId,
                    RoleId = organizerRole.Id,
                    AssignedAt = DateTime.UtcNow
                };
                _context.UserRoles.Add(userRole);
            }
        }

        request.Status = "Approved";
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByAdminId = adminId;
        request.ReviewNotes = "Approved by admin";

        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendOrganizerVerificationEmailAsync(
                request.User.Email,
                request.User.FullName,
                request.OrganizationName
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send organizer approval email to {Email}", request.User.Email);
        }

        _logger.LogInformation("Organizer request {RequestId} approved by admin {AdminId}", requestId, adminId);

        return request;
    }

    public async Task<OrganizerRequest> RejectOrganizerRequestAsync(int requestId, int adminId, string? reviewNotes = null)
    {
        var request = await _context.OrganizerRequests
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (request == null)
            throw new NotFoundException($"Organizer request with ID {requestId} not found");

        if (request.Status != "Pending")
            throw new BadRequestException($"Request is already {request.Status}");

        request.Status = "Rejected";
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByAdminId = adminId;
        request.ReviewNotes = reviewNotes ?? "Rejected by admin";

        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendEmailAsync(
                request.User.Email,
                "Organizer Application Update - Tickify",
                $"<h2>Hello {request.User.FullName},</h2>" +
                $"<p>Thank you for your interest in becoming an organizer on Tickify.</p>" +
                $"<p>Unfortunately, we are unable to approve your application at this time.</p>" +
                $"<p><strong>Reason:</strong> {request.ReviewNotes}</p>" +
                $"<p>You may submit a new application in the future if you wish.</p>" +
                $"<p>Best regards,<br/>The Tickify Team</p>"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send organizer rejection email to {Email}", request.User.Email);
        }

        _logger.LogInformation("Organizer request {RequestId} rejected by admin {AdminId}", requestId, adminId);

        return request;
    }

    public async Task<Event> ApproveEventAsync(int eventId, int adminId)
    {
        var eventEntity = await _context.Events
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {eventId} not found");

        if (eventEntity.Status != EventStatus.Pending)
            throw new BadRequestException($"Event is already {eventEntity.Status}");

        var hasSeatMap = await _context.SeatMaps
            .AnyAsync(sm => sm.EventId == eventId && sm.IsActive);
        
        if (!hasSeatMap)
        {
            throw new BadRequestException(
                "Cannot approve event: Seat map is required. " +
                "Please ensure the organizer has created a seat map for this event before approval."
            );
        }

        var seatMap = await _context.SeatMaps
            .Include(sm => sm.Zones)
            .FirstOrDefaultAsync(sm => sm.EventId == eventId && sm.IsActive);
        
        if (seatMap != null)
        {
            var hasSeatZones = seatMap.Zones != null && seatMap.Zones.Any();
            if (!hasSeatZones)
            {
                throw new BadRequestException(
                    "Cannot approve event: Seat map has no zones configured. " +
                    "Please ensure the seat map has at least one zone with seats."
                );
            }

            var zoneIds = seatMap.Zones?.Select(z => z.Id).ToList() ?? new List<int>();
            var seatCount = await _context.Seats
                .Where(s => s.SeatZoneId.HasValue && zoneIds.Contains(s.SeatZoneId.Value))
                .CountAsync();
            
            if (seatCount == 0)
            {
                throw new BadRequestException(
                    "Cannot approve event: Seat map has no seats configured. " +
                    "Please ensure the organizer has added seats to the seat map."
                );
            }
        }

        eventEntity.Status = EventStatus.Published;
        eventEntity.ApprovedByStaffId = adminId;
        eventEntity.ApprovedAt = DateTime.UtcNow;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendEmailAsync(
                eventEntity.Organizer!.User!.Email,
                "Event Approved - Tickify",
                $"<h2>Event Approved!</h2>" +
                $"<p>Your event '<strong>{eventEntity.Title}</strong>' has been approved and is now published.</p>" +
                $"<p>Users can now view and purchase tickets for your event.</p>" +
                $"<p>Event Date: {eventEntity.StartDate:MMMM dd, yyyy}</p>" +
                $"<p>Best regards,<br/>The Tickify Team</p>"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send event approval email for event {EventId}", eventId);
        }

        try
        {
            await _notificationService.NotifyEventApprovedAsync(
                eventEntity.OrganizerId,
                eventEntity.Id,
                eventEntity.Title
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send event approval notification for event {EventId}", eventId);
        }

        _logger.LogInformation("Event {EventId} approved by admin {AdminId}", eventId, adminId);

        return eventEntity;
    }

    public async Task<Event> RejectEventAsync(int eventId, int adminId, string? rejectionReason = null)
    {
        var eventEntity = await _context.Events
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (eventEntity == null)
            throw new NotFoundException($"Event with ID {eventId} not found");

        if (eventEntity.Status != EventStatus.Pending)
            throw new BadRequestException($"Event is already {eventEntity.Status}");

        eventEntity.Status = EventStatus.Rejected;
        eventEntity.RejectionReason = rejectionReason ?? "Rejected by admin";
        eventEntity.ApprovedByStaffId = adminId;
        eventEntity.ApprovedAt = DateTime.UtcNow;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendEmailAsync(
                eventEntity.Organizer!.User!.Email,
                "Event Review Update - Tickify",
                $"<h2>Event Review Update</h2>" +
                $"<p>Your event '<strong>{eventEntity.Title}</strong>' has been reviewed.</p>" +
                $"<p>Unfortunately, we are unable to approve this event at this time.</p>" +
                $"<p><strong>Reason:</strong> {eventEntity.RejectionReason}</p>" +
                $"<p>You may edit and resubmit the event after addressing the concerns mentioned above.</p>" +
                $"<p>Best regards,<br/>The Tickify Team</p>"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send event rejection email for event {EventId}", eventId);
        }

        try
        {
            await _notificationService.NotifyEventRejectedAsync(
                eventEntity.OrganizerId,
                eventEntity.Id,
                eventEntity.Title,
                eventEntity.RejectionReason ?? "Rejected by admin"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send event rejection notification for event {EventId}", eventId);
        }

        _logger.LogInformation("Event {EventId} rejected by admin {AdminId}", eventId, adminId);

        return eventEntity;
    }

    public async Task<List<Event>> GetAllPendingEventsAsync()
    {
        return await _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Where(e => e.Status == EventStatus.Pending)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Event>> GetAllEventsAsync()
    {
        return await _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<EventAnalyticsDto>> GetAllEventsWithAnalyticsAsync()
    {
        var events = await _context.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
                .ThenInclude(o => o!.User)
            .Include(e => e.TicketTypes)
            .Include(e => e.Bookings!)
                .ThenInclude(b => b.Tickets)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var eventAnalyticsList = events.Select(e =>
        {
            var capacity = e.TicketTypes?.Sum(tt => tt.TotalQuantity) ?? 0;

            var soldTickets = e.TicketTypes?.Sum(tt => tt.TotalQuantity - tt.AvailableQuantity) ?? 0;

            var revenue = e.Bookings?
                .Where(b => b.Status == BookingStatus.Confirmed)
                .Sum(b => b.TotalAmount) ?? 0m;

            var salesRate = capacity > 0 ? (double)soldTickets / capacity * 100 : 0;

            return new EventAnalyticsDto
            {
                EventId = e.Id,
                Title = e.Title,
                BannerImage = e.BannerImage,
                PosterImage = e.PosterImage,
                Location = e.Location,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                Status = e.Status.ToString(),
                CategoryName = e.Category?.Name ?? "Unknown",
                OrganizerName = e.Organizer?.User?.FullName ?? "Unknown",
                OrganizerId = e.OrganizerId,
                CreatedAt = e.CreatedAt,
                Revenue = revenue,
                SoldTickets = soldTickets,
                Capacity = capacity,
                SalesRate = Math.Round(salesRate, 2)
            };
        }).ToList();

        return eventAnalyticsList;
    }

    public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync()
    {
        var totalRevenue = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var platformFees = totalRevenue * 0.10m;

        var totalEvents = await _context.Events.CountAsync();
        var activeEvents = await _context.Events
            .CountAsync(e => e.Status == EventStatus.Published || e.Status == EventStatus.Approved);
        var pendingEvents = await _context.Events
            .CountAsync(e => e.Status == EventStatus.Pending);

        var totalUsers = await _context.Users.CountAsync();
        var activeUsers = await _context.Users
            .CountAsync(u => u.IsActive);

        var totalOrganizers = await _context.Organizers.CountAsync();
        var pendingOrganizerRequests = await _context.OrganizerRequests
            .CountAsync(r => r.Status == "Pending");

        var now = DateTime.UtcNow;
        var lastMonth = new DateTime(now.Year, now.Month, 1).AddMonths(-1);
        var previousMonth = lastMonth.AddMonths(-1);
        var lastMonthRevenue = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed &&
                       p.PaidAt >= lastMonth &&
                       p.PaidAt < lastMonth.AddMonths(1))
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;
        var previousMonthRevenue = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed &&
                       p.PaidAt >= previousMonth &&
                       p.PaidAt < lastMonth)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;
        var revenueGrowth = previousMonthRevenue > 0
            ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
            : 0m;

        var lastMonthUsers = await _context.Users
            .CountAsync(u => u.CreatedAt >= lastMonth && u.CreatedAt < lastMonth.AddMonths(1));
        var previousMonthUsers = await _context.Users
            .CountAsync(u => u.CreatedAt >= previousMonth && u.CreatedAt < lastMonth);
        var userGrowth = previousMonthUsers > 0
            ? ((lastMonthUsers - previousMonthUsers) / (decimal)previousMonthUsers) * 100
            : 0m;

        return new AdminDashboardStatsDto
        {
            TotalRevenue = totalRevenue,
            PlatformFees = platformFees,
            TotalEvents = totalEvents,
            ActiveEvents = activeEvents,
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            TotalOrganizers = totalOrganizers,
            PendingEvents = pendingEvents,
            PendingOrganizerRequests = pendingOrganizerRequests,
            RevenueGrowthPercentage = revenueGrowth,
            UserGrowthPercentage = userGrowth
        };
    }

    public async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int months = 6)
    {
        var now = DateTime.UtcNow;
        var results = new List<MonthlyRevenueDto>();

        for (int i = months - 1; i >= 0; i--)
        {
            var monthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);

            var revenue = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Completed &&
                           p.PaidAt >= monthStart &&
                           p.PaidAt < monthEnd)
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

            var users = await _context.Users
                .CountAsync(u => u.CreatedAt >= monthStart && u.CreatedAt < monthEnd);

            var monthName = monthStart.ToString("MMM", CultureInfo.InvariantCulture);
            results.Add(new MonthlyRevenueDto
            {
                Month = monthName,
                Revenue = revenue,
                Users = users
            });
        }

        return results;
    }

    public async Task<List<CategoryDistributionDto>> GetCategoryDistributionAsync()
    {
        var totalEvents = await _context.Events.CountAsync();
        if (totalEvents == 0)
        {
            return new List<CategoryDistributionDto>();
        }

        var categoryStats = await _context.Events
            .Include(e => e.Category)
            .Where(e => e.Category != null)
            .GroupBy(e => new { e.Category!.Id, e.Category.Name })
            .Select(g => new
            {
                CategoryName = g.Key.Name,
                Count = g.Count(),
                Percentage = (g.Count() * 100.0) / totalEvents
            })
            .ToListAsync();

        var colors = new[] { "#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#6b7280", "#ef4444", "#f59e0b" };
        var colorIndex = 0;

        return categoryStats.Select(c => new CategoryDistributionDto
        {
            Name = c.CategoryName,
            Value = (int)Math.Round(c.Percentage),
            Color = colors[colorIndex++ % colors.Length]
        }).ToList();
    }

    public async Task<List<RecentUserDto>> GetRecentUsersAsync(int count = 5)
    {
        var recentUsers = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(count)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.CreatedAt,
                Orders = _context.Bookings.Count(b => b.UserId == u.Id && b.Status == BookingStatus.Confirmed),
                Spent = _context.Bookings
                    .Where(b => b.UserId == u.Id && 
                               b.Status == BookingStatus.Confirmed &&
                               b.Payment != null &&
                               b.Payment.Status == PaymentStatus.Completed)
                    .Sum(b => (decimal?)b.Payment!.Amount) ?? 0m
            })
            .ToListAsync();

        return recentUsers.Select(u => new RecentUserDto
        {
            Id = u.Id,
            Name = u.FullName,
            Email = u.Email,
            Joined = u.CreatedAt,
            Orders = u.Orders,
            Spent = u.Spent
        }).ToList();
    }

    public async Task<List<OrganizerListDto>> GetOrganizersListAsync()
    {
        var organizers = await _context.Organizers
            .Include(o => o.User)
            .Select(o => new
            {
                o.Id,
                CompanyName = o.CompanyName,
                Email = o.User != null ? o.User.Email : "",
                IsVerified = o.IsVerified,
                Events = _context.Events.Count(e => e.OrganizerId == o.Id),
                Revenue = _context.Events
                    .Where(e => e.OrganizerId == o.Id)
                    .SelectMany(e => e.Bookings!)
                    .Where(b => b.Status == BookingStatus.Confirmed &&
                               b.Payment != null &&
                               b.Payment.Status == PaymentStatus.Completed)
                    .Sum(b => (decimal?)b.Payment!.Amount) ?? 0m
            })
            .ToListAsync();

        return organizers.Select(o => new OrganizerListDto
        {
            Id = o.Id,
            Name = o.CompanyName,
            Email = o.Email,
            Events = o.Events,
            Revenue = o.Revenue,
            Status = o.IsVerified ? "verified" : "pending"
        }).ToList();
    }
}
