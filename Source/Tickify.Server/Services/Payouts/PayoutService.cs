using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Payout;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Services.Payouts;

public sealed class PayoutService : IPayoutService
{
    private readonly IPayoutRepository _payoutRepo;
    private readonly IEventRepository _eventRepo;
    private readonly IBookingRepository _bookingRepo;
    private readonly ApplicationDbContext _db;

    public PayoutService(
        IPayoutRepository payoutRepo,
        IEventRepository eventRepo,
        IBookingRepository bookingRepo,
        ApplicationDbContext db)
    {
        _payoutRepo = payoutRepo;
        _eventRepo = eventRepo;
        _bookingRepo = bookingRepo;
        _db = db;
    }

    public async Task<PayoutDto> RequestPayoutAsync(RequestPayoutDto dto, ClaimsPrincipal user)
    {
        var userId = GetUserId(user);
        
        // Get event and verify organizer ownership
        var eventEntity = await _eventRepo.GetByIdAsync(dto.EventId, includeRelated: true)
            ?? throw new InvalidOperationException("Event not found");

        // Get organizer from user
        var organizer = await _db.Organizers
            .FirstOrDefaultAsync(o => o.UserId == userId)
            ?? throw new UnauthorizedAccessException("User is not an organizer");

        if (eventEntity.OrganizerId != organizer.Id)
            throw new UnauthorizedAccessException("You don't own this event");

        // Calculate earnings from confirmed bookings
        var bookings = await _bookingRepo.GetByEventIdAsync(dto.EventId);
        var confirmedBookings = bookings.Where(b => b.Status == BookingStatus.Confirmed).ToList();
        
        var totalRevenue = confirmedBookings.Sum(b => b.TotalAmount);
        var platformFee = totalRevenue * 0.10m; // 10% platform fee
        var organizerEarnings = totalRevenue - platformFee;

        // Validate requested amount
        if (dto.Amount > organizerEarnings)
            throw new InvalidOperationException("Requested amount exceeds available earnings");

        // Check for existing pending payout for this event
        var existingPayout = await _db.Payouts
            .FirstOrDefaultAsync(p => p.OrganizerId == organizer.Id && 
                                     p.Status == "Pending" &&
                                     p.RequestedAt >= DateTime.UtcNow.AddDays(-30)); // Within last 30 days

        if (existingPayout != null)
            throw new InvalidOperationException("You already have a pending payout request");

        var payout = new Payout
        {
            OrganizerId = organizer.Id,
            Amount = dto.Amount,
            Status = "Pending",
            BankName = dto.BankName,
            BankAccountNumber = dto.BankAccountNumber,
            BankAccountName = dto.AccountHolderName,
            RequestedAt = DateTime.UtcNow
        };

        var created = await _payoutRepo.CreateAsync(payout);
        return MapToDto(created);
    }

    public async Task<IEnumerable<PayoutDto>> GetAllPayoutsAsync(ClaimsPrincipal user)
    {
        var userId = GetUserId(user);
        var isAdmin = user.IsInRole("Admin");

        if (isAdmin)
        {
            var allPayouts = await _payoutRepo.GetAllAsync();
            return allPayouts.Select(MapToDto);
        }
        else
        {
            // Organizer can only see their own payouts
            var organizer = await _db.Organizers
                .FirstOrDefaultAsync(o => o.UserId == userId)
                ?? throw new UnauthorizedAccessException("User is not an organizer");

            var payouts = await _payoutRepo.GetByOrganizerIdAsync(organizer.Id);
            return payouts.Select(MapToDto);
        }
    }

    public async Task<PayoutDto?> GetPayoutByIdAsync(int id, ClaimsPrincipal user)
    {
        var payout = await _payoutRepo.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Payout not found");

        var userId = GetUserId(user);
        var isAdmin = user.IsInRole("Admin");

        if (!isAdmin)
        {
            var organizer = await _db.Organizers
                .FirstOrDefaultAsync(o => o.UserId == userId)
                ?? throw new UnauthorizedAccessException("User is not an organizer");

            if (payout.OrganizerId != organizer.Id)
                throw new UnauthorizedAccessException("You don't have permission to view this payout");
        }

        return MapToDto(payout);
    }

    public async Task<PayoutDto> ApprovePayoutAsync(int id, ClaimsPrincipal admin, ApprovePayoutDto dto)
    {
        if (!admin.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Only admins can approve payouts");

        var payout = await _payoutRepo.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Payout not found");

        if (payout.Status != "Pending")
            throw new InvalidOperationException($"Cannot approve payout with status: {payout.Status}");

        payout.Status = "Approved";
        payout.ProcessedByStaffId = GetUserId(admin);
        payout.ProcessedAt = DateTime.UtcNow;
        payout.Notes = dto.Notes;

        // TODO: Integrate with bank transfer API here
        // For now, we'll mark it as approved and can be processed later

        var updated = await _payoutRepo.UpdateAsync(payout);
        return MapToDto(updated);
    }

    public async Task<PayoutDto> RejectPayoutAsync(int id, ClaimsPrincipal admin, RejectPayoutDto dto)
    {
        if (!admin.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Only admins can reject payouts");

        var payout = await _payoutRepo.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Payout not found");

        if (payout.Status != "Pending")
            throw new InvalidOperationException($"Cannot reject payout with status: {payout.Status}");

        payout.Status = "Rejected";
        payout.ProcessedByStaffId = GetUserId(admin);
        payout.ProcessedAt = DateTime.UtcNow;
        payout.Notes = dto.Reason + (string.IsNullOrEmpty(dto.Notes) ? "" : $"\n{dto.Notes}");

        var updated = await _payoutRepo.UpdateAsync(payout);
        return MapToDto(updated);
    }

    public async Task<PayoutStatsDto> GetOrganizerStatsAsync(int organizerId, ClaimsPrincipal user)
    {
        var userId = GetUserId(user);
        var isAdmin = user.IsInRole("Admin");

        // Verify access
        if (!isAdmin)
        {
            var organizer = await _db.Organizers
                .FirstOrDefaultAsync(o => o.UserId == userId)
                ?? throw new UnauthorizedAccessException("User is not an organizer");

            if (organizer.Id != organizerId)
                throw new UnauthorizedAccessException("You can only view your own stats");
        }

        var targetOrganizer = await _db.Organizers
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == organizerId)
            ?? throw new InvalidOperationException("Organizer not found");

        // Get all events for this organizer
        var events = await _eventRepo.GetByOrganizerIdAsync(organizerId, 1, int.MaxValue);
        var eventIds = events.Items.Select(e => e.Id).ToList();

        // Calculate revenue from all confirmed bookings
        var allBookings = new List<Booking>();
        foreach (var eventId in eventIds)
        {
            var bookings = await _bookingRepo.GetByEventIdAsync(eventId);
            allBookings.AddRange(bookings);
        }

        var confirmedBookings = allBookings.Where(b => b.Status == BookingStatus.Confirmed).ToList();
        var totalRevenue = confirmedBookings.Sum(b => b.TotalAmount);
        var platformFee = totalRevenue * 0.10m; // 10% platform fee
        var totalEarnings = totalRevenue - platformFee;

        // Get payout statistics
        var payouts = await _payoutRepo.GetByOrganizerIdAsync(organizerId);
        var payoutList = payouts.ToList();

        var stats = new PayoutStatsDto
        {
            OrganizerId = targetOrganizer.Id,
            OrganizerName = targetOrganizer.CompanyName,
            TotalRevenue = totalRevenue,
            TotalPlatformFees = platformFee,
            TotalEarnings = totalEarnings,
            PendingPayouts = payoutList.Where(p => p.Status == "Pending").Sum(p => p.Amount),
            ApprovedPayouts = payoutList.Where(p => p.Status == "Approved").Sum(p => p.Amount),
            ProcessedPayouts = payoutList.Where(p => p.Status == "Processed").Sum(p => p.Amount),
            TotalPayoutRequests = payoutList.Count,
            PendingPayoutRequests = payoutList.Count(p => p.Status == "Pending")
        };

        return stats;
    }

    private static PayoutDto MapToDto(Payout payout)
    {
        return new PayoutDto
        {
            PayoutId = payout.Id,
            OrganizerId = payout.OrganizerId,
            OrganizerName = payout.Organizer?.CompanyName ?? "Unknown",
            Amount = payout.Amount,
            Status = payout.Status,
            TransactionId = null, // Can be set when processing
            RequestedAt = payout.RequestedAt,
            ProcessedAt = payout.ProcessedAt
        };
    }

    private static int GetUserId(ClaimsPrincipal user)
    {
        var idStr = user.FindFirstValue("userId") 
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier) 
            ?? "0";
        return int.TryParse(idStr, out var id) ? id : 0;
    }
}

