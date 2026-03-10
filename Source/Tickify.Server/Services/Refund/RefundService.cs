using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Tickify.Data;
using Tickify.DTOs.Refund;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Services.Email;
using Tickify.Services.Payments;

namespace Tickify.Services.Refunds;

public interface IRefundService
{
    Task<RefundRequest> CreateAsync(CreateRefundRequestDto dto, ClaimsPrincipal user);
    Task<IEnumerable<RefundRequest>> GetAllAsync();
    Task<RefundRequest?> GetByIdAsync(int id);
    Task<IEnumerable<RefundRequest>> GetMineAsync(ClaimsPrincipal user);
    Task<RefundRequest> ApproveAsync(int id, ClaimsPrincipal staff, ApproveRefundDto dto);
    Task<RefundRequest> RejectAsync(int id, ClaimsPrincipal staff, RejectRefundDto dto);
}

public sealed class RefundService : IRefundService
{
    private readonly IRefundRequestRepository _repo;
    private readonly IBookingRepository _bookings;
    private readonly IPaymentRepository _payments;
    private readonly Payments.IPaymentService _paymentService;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RefundService> _logger;

    public RefundService(
        IRefundRequestRepository repo,
        IBookingRepository bookings,
        IPaymentRepository payments,
        Payments.IPaymentService paymentService,
        IEmailService emailService,
        INotificationService notificationService,
        ApplicationDbContext context,
        ILogger<RefundService> logger)
    {
        _repo = repo;
        _bookings = bookings;
        _payments = payments;
        _paymentService = paymentService;
        _emailService = emailService;
        _notificationService = notificationService;
        _context = context;
        _logger = logger;
    }

    public async Task<RefundRequest> CreateAsync(CreateRefundRequestDto dto, ClaimsPrincipal user)
    {
        var userId = GetUserId(user);
        
        // Load booking with related data
        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Event)
            .FirstOrDefaultAsync(b => b.Id == dto.BookingId)
            ?? throw new InvalidOperationException("Booking not found");

        // Validate booking ownership
        if (booking.UserId != userId)
            throw new UnauthorizedAccessException("You can only request refunds for your own bookings");

        // Validate booking status
        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException($"Cannot request refund for booking with status: {booking.Status}. Only confirmed bookings can be refunded.");

        // Check if event allows refunds
        if (booking.Event != null && !booking.Event.AllowRefund)
            throw new InvalidOperationException("This event does not allow ticket refunds");

        // Check if booking already has a pending refund request
        var existingRefund = await _context.RefundRequests
            .FirstOrDefaultAsync(r => r.BookingId == booking.Id && r.Status == "Pending");
        if (existingRefund != null)
            throw new InvalidOperationException("A pending refund request already exists for this booking");

        // Validate payment exists and is completed
        var latestPayment = (await _payments.ListByBookingAsync(booking.Id, default)).FirstOrDefault();
        if (latestPayment is null || latestPayment.Status != PaymentStatus.Completed)
            throw new InvalidOperationException("Booking is not paid or payment is not completed");

        // Validate refund amount
        if (dto.RefundAmount <= 0)
            throw new InvalidOperationException("Refund amount must be greater than 0");
        
        if (dto.RefundAmount > booking.TotalAmount)
            throw new InvalidOperationException($"Refund amount ({dto.RefundAmount}) cannot exceed booking total amount ({booking.TotalAmount})");

        // Validate reason
        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new InvalidOperationException("Refund reason is required");

        var req = new RefundRequest
        {
            BookingId = booking.Id,
            UserId = userId,
            Reason = dto.Reason.Trim(),
            RefundAmount = dto.RefundAmount,
            Status = "Pending"
        };
        
        var created = await _repo.CreateAsync(req);

        // Send email notification to user
        try
        {
            if (booking.User != null)
            {
                await _emailService.SendEmailAsync(
                    booking.User.Email,
                    "Refund Request Received",
                    $"<h2>Refund Request Received</h2>" +
                    $"<p>Your refund request for booking <strong>{booking.BookingCode}</strong> has been received.</p>" +
                    $"<p><strong>Event:</strong> {booking.Event?.Title ?? "Unknown"}</p>" +
                    $"<p><strong>Refund Amount:</strong> {dto.RefundAmount:N0} VND</p>" +
                    $"<p><strong>Reason:</strong> {dto.Reason}</p>" +
                    $"<p>We will review your request and notify you of the decision within 3-5 business days.</p>"
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[RefundService] Failed to send email notification for refund request {RefundId}", created.Id);
            // Don't throw - email failure shouldn't block refund request creation
        }

        return created;
    }

    public Task<IEnumerable<RefundRequest>> GetAllAsync() => _repo.GetAllAsync();

    public Task<RefundRequest?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

    public Task<IEnumerable<RefundRequest>> GetMineAsync(ClaimsPrincipal user)
        => _repo.GetByUserIdAsync(GetUserId(user));

    public async Task<RefundRequest> ApproveAsync(int id, ClaimsPrincipal staff, ApproveRefundDto dto)
    {
        // Load refund request with related data
        var req = await _context.RefundRequests
            .Include(r => r.User)
            .Include(r => r.Booking)
                .ThenInclude(b => b!.Event)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new InvalidOperationException("Refund request not found");

        if (req.Status is "Approved" or "Rejected" or "Processed")
            throw new InvalidOperationException($"Cannot approve refund request with status: {req.Status}");

        // Attempt to process refund through payment gateway
        var payment = (await _payments.ListByBookingAsync(req.BookingId, default)).FirstOrDefault();
        var refundOk = false;
        
        if (payment != null)
        {
            try
            {
                refundOk = await _paymentService.RefundAsync(
                    new Tickify.DTOs.Payment.RefundDto 
                    { 
                        PaymentId = payment.Id, 
                        Amount = req.RefundAmount, 
                        Reason = dto.StaffNotes ?? "Refund Approved" 
                    },
                    default);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[RefundService] Failed to process refund through payment gateway for refund {RefundId}", id);
                // Continue - will mark as Approved for manual processing
            }
        }

        // Update refund request status
        req.Status = refundOk ? "Processed" : "Approved";
        req.ReviewedByStaffId = GetUserId(staff);
        req.ReviewedAt = DateTime.UtcNow;
        req.StaffNotes = dto.StaffNotes;
        if (refundOk) req.ProcessedAt = DateTime.UtcNow;

        var updated = await _repo.UpdateAsync(req);

        // Send email notification to user
        try
        {
            if (req.User != null)
            {
                var statusMessage = refundOk 
                    ? "Your refund has been processed and the amount will be returned to your original payment method within 5-7 business days."
                    : "Your refund request has been approved and will be processed manually. You will receive the refund within 5-7 business days.";

                await _emailService.SendEmailAsync(
                    req.User.Email,
                    "Refund Request Approved",
                    $"<h2>Refund Request Approved</h2>" +
                    $"<p>Your refund request for booking <strong>{req.Booking?.BookingCode ?? "N/A"}</strong> has been approved.</p>" +
                    $"<p><strong>Event:</strong> {req.Booking?.Event?.Title ?? "Unknown"}</p>" +
                    $"<p><strong>Refund Amount:</strong> {req.RefundAmount:N0} VND</p>" +
                    $"<p>{statusMessage}</p>" +
                    (!string.IsNullOrEmpty(dto.StaffNotes) ? $"<p><strong>Staff Notes:</strong> {dto.StaffNotes}</p>" : "")
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[RefundService] Failed to send email notification for approved refund {RefundId}", id);
        }

        // Send in-app notification
        try
        {
            await _notificationService.NotifyRefundApprovedAsync(req.UserId, id, req.RefundAmount);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[RefundService] Failed to send in-app notification for approved refund {RefundId}", id);
        }

        return updated;
    }

    public async Task<RefundRequest> RejectAsync(int id, ClaimsPrincipal staff, RejectRefundDto dto)
    {
        // Load refund request with related data
        var req = await _context.RefundRequests
            .Include(r => r.User)
            .Include(r => r.Booking)
                .ThenInclude(b => b!.Event)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new InvalidOperationException("Refund request not found");

        if (req.Status is "Approved" or "Rejected" or "Processed")
            throw new InvalidOperationException($"Cannot reject refund request with status: {req.Status}");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new InvalidOperationException("Rejection reason is required");

        req.Status = "Rejected";
        req.ReviewedByStaffId = GetUserId(staff);
        req.ReviewedAt = DateTime.UtcNow;
        req.StaffNotes = dto.Reason.Trim();

        var updated = await _repo.UpdateAsync(req);

        // Send email notification to user
        try
        {
            if (req.User != null)
            {
                await _emailService.SendEmailAsync(
                    req.User.Email,
                    "Refund Request Rejected",
                    $"<h2>Refund Request Rejected</h2>" +
                    $"<p>We regret to inform you that your refund request for booking <strong>{req.Booking?.BookingCode ?? "N/A"}</strong> has been rejected.</p>" +
                    $"<p><strong>Event:</strong> {req.Booking?.Event?.Title ?? "Unknown"}</p>" +
                    $"<p><strong>Refund Amount:</strong> {req.RefundAmount:N0} VND</p>" +
                    $"<p><strong>Reason:</strong> {dto.Reason}</p>" +
                    $"<p>If you have any questions or concerns, please contact our support team.</p>"
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[RefundService] Failed to send email notification for rejected refund {RefundId}", id);
        }

        // Send in-app notification
        try
        {
            await _notificationService.NotifyRefundRejectedAsync(req.UserId, id, dto.Reason);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[RefundService] Failed to send in-app notification for rejected refund {RefundId}", id);
        }

        return updated;
    }

    private static int GetUserId(ClaimsPrincipal user)
    {
        // Tùy token của bạn: "sub" | "userId" | ClaimTypes.NameIdentifier
        var idStr = user.FindFirstValue("userId") ?? user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        return int.TryParse(idStr, out var id) ? id : 0;
    }
}
