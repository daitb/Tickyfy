using System.Security.Claims;
using Tickify.DTOs.Refund;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
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
    private readonly IPaymentService _paymentService;

    public RefundService(
        IRefundRequestRepository repo,
        IBookingRepository bookings,
        IPaymentRepository payments,
        IPaymentService paymentService)
    {
        _repo = repo; _bookings = bookings; _payments = payments; _paymentService = paymentService;
    }

    public async Task<RefundRequest> CreateAsync(CreateRefundRequestDto dto, ClaimsPrincipal user)
    {
        var userId = GetUserId(user);
        var booking = await _bookings.GetByIdAsync(dto.BookingId)
                      ?? throw new InvalidOperationException("Booking not found");

        // Optional rule: chỉ cho refund khi booking đã thanh toán
        var latestPayment = (await _payments.ListByBookingAsync(booking.Id, default)).FirstOrDefault();
        if (latestPayment is null || latestPayment.Status != PaymentStatus.Completed)
            throw new InvalidOperationException("Booking is not paid");

        var req = new RefundRequest
        {
            BookingId = booking.Id,
            UserId = userId,
            Reason = dto.Reason,
            RefundAmount = dto.RefundAmount,
            Status = "Pending"
        };
        return await _repo.CreateAsync(req);
    }

    public Task<IEnumerable<RefundRequest>> GetAllAsync() => _repo.GetAllAsync();

    public Task<RefundRequest?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

    public Task<IEnumerable<RefundRequest>> GetMineAsync(ClaimsPrincipal user)
        => _repo.GetByUserIdAsync(GetUserId(user));

    public async Task<RefundRequest> ApproveAsync(int id, ClaimsPrincipal staff, ApproveRefundDto dto)
    {
        var req = await _repo.GetByIdAsync(id) ?? throw new InvalidOperationException("Refund not found");
        if (req.Status is "Approved" or "Rejected" or "Processed")
            return req;

        // Gọi hoàn tiền qua PaymentService (nếu provider support) — nếu không, đánh dấu Approved để Week3 payout
        var payment = (await _payments.ListByBookingAsync(req.BookingId, default)).FirstOrDefault();
        var refundOk = false;
        if (payment != null)
        {
            refundOk = await _paymentService.RefundAsync(
                new Tickify.DTOs.Payment.RefundDto { PaymentId = payment.Id, Amount = req.RefundAmount, Reason = dto.StaffNotes ?? "Refund Approved" },
                default);
        }

        req.Status = refundOk ? "Processed" : "Approved";
        req.ReviewedByStaffId = GetUserId(staff);
        req.ReviewedAt = DateTime.UtcNow;
        req.StaffNotes = dto.StaffNotes;
        if (refundOk) req.ProcessedAt = DateTime.UtcNow;

        return await _repo.UpdateAsync(req);
    }

    public async Task<RefundRequest> RejectAsync(int id, ClaimsPrincipal staff, RejectRefundDto dto)
    {
        var req = await _repo.GetByIdAsync(id) ?? throw new InvalidOperationException("Refund not found");
        if (req.Status is "Approved" or "Rejected" or "Processed")
            return req;

        req.Status = "Rejected";
        req.ReviewedByStaffId = GetUserId(staff);
        req.ReviewedAt = DateTime.UtcNow;
        req.StaffNotes = dto.Reason;

        return await _repo.UpdateAsync(req);
    }

    private static int GetUserId(ClaimsPrincipal user)
    {
        // Tùy token của bạn: "sub" | "userId" | ClaimTypes.NameIdentifier
        var idStr = user.FindFirstValue("userId") ?? user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        return int.TryParse(idStr, out var id) ? id : 0;
    }
}
