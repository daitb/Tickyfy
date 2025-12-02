using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Admin;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Services.Email;

namespace Tickify.Services;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<AdminService> _logger;

    public AdminService(
        ApplicationDbContext context,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IUserRoleRepository userRoleRepository,
        IEmailService emailService,
        ILogger<AdminService> logger)
    {
        _context = context;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _emailService = emailService;
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

        // Check if user already has Organizer role or profile
        var existingOrganizer = await _context.Organizers
            .FirstOrDefaultAsync(o => o.UserId == request.UserId);

        if (existingOrganizer != null)
            throw new ConflictException("User is already an organizer");

        // Create Organizer profile
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

        // Assign Organizer role
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

        // Update request status
        request.Status = "Approved";
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByAdminId = adminId;
        request.ReviewNotes = "Approved by admin";

        await _context.SaveChangesAsync();

        // Send approval email
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

        // Send rejection email
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

    // Event Approval Methods
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

        // Update event status to Published
        eventEntity.Status = EventStatus.Published;
        eventEntity.ApprovedByStaffId = adminId;
        eventEntity.ApprovedAt = DateTime.UtcNow;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Send approval email to organizer
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

        // Update event status to Rejected
        eventEntity.Status = EventStatus.Rejected;
        eventEntity.RejectionReason = rejectionReason ?? "Rejected by admin";
        eventEntity.ApprovedByStaffId = adminId;
        eventEntity.ApprovedAt = DateTime.UtcNow;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Send rejection email to organizer
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
}
