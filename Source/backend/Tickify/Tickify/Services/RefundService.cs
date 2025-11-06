using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Refund;
using Tickify.Models;
using Tickify.Services.Email;

namespace Tickify.Services
{
    public interface IRefundService
    {
        Task<RefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto request, Guid userId);
        Task<List<RefundRequestDto>> GetRefundRequestsAsync(RefundStatus? status = null);
        Task<List<RefundRequestDto>> GetUserRefundRequestsAsync(Guid userId);
        Task<RefundRequestDto> GetRefundRequestAsync(Guid refundId);
        Task<RefundRequestDto> ApproveRefundAsync(Guid refundId, ApproveRefundDto request, Guid adminId);
        Task<RefundRequestDto> RejectRefundAsync(Guid refundId, RejectRefundDto request, Guid adminId);
        Task<bool> CanRequestRefundAsync(Guid bookingId, Guid userId);
    }

    public class RefundService : IRefundService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPaymentService _paymentService;
        private readonly ILogger<RefundService> _logger;

        public RefundService(ApplicationDbContext context, IPaymentService paymentService, ILogger<RefundService> logger)
        {
            _context = context;
            _paymentService = paymentService;
            _logger = logger;
        }

        public async Task<RefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto request, Guid userId)
        {
            var canRefund = await CanRequestRefundAsync(request.BookingId, userId);
            if (!canRefund)
                throw new Exception("Không thể yêu cầu hoàn tiền cho booking này");

            var booking = await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId);

            if (booking == null)
                throw new Exception("Booking not found");

            var refundRequest = new RefundRequest
            {
                Id = Guid.NewGuid(),
                BookingId = request.BookingId,
                UserId = userId,
                Amount = booking.TotalAmount,
                Reason = request.Reason,
                EvidenceUrls = request.EvidenceUrls ?? new List<string>(),
                Status = RefundStatus.Pending,
                RequestedAt = DateTime.UtcNow
            };

            _context.RefundRequests.Add(refundRequest);
            booking.Status = BookingStatus.RefundRequested;
            await _context.SaveChangesAsync();

            return await MapToRefundRequestDto(refundRequest);
        }

        public async Task<List<RefundRequestDto>> GetRefundRequestsAsync(RefundStatus? status = null)
        {
            var query = _context.RefundRequests
                .Include(r => r.Booking)
                    .ThenInclude(b => b.Event)
                .Include(r => r.User)
                .Include(r => r.ProcessedByAdmin)
                .AsQueryable();

            if (status.HasValue)
                query = query.Where(r => r.Status == status.Value);

            var refunds = await query
                .OrderByDescending(r => r.RequestedAt)
                .ToListAsync();

            var refundDtos = new List<RefundRequestDto>();
            foreach (var refund in refunds)
            {
                refundDtos.Add(await MapToRefundRequestDto(refund));
            }

            return refundDtos;
        }

        public async Task<List<RefundRequestDto>> GetUserRefundRequestsAsync(Guid userId)
        {
            var refunds = await _context.RefundRequests
                .Include(r => r.Booking)
                    .ThenInclude(b => b.Event)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.RequestedAt)
                .ToListAsync();

            var refundDtos = new List<RefundRequestDto>();
            foreach (var refund in refunds)
            {
                refundDtos.Add(await MapToRefundRequestDto(refund));
            }

            return refundDtos;
        }

        public async Task<RefundRequestDto> GetRefundRequestAsync(Guid refundId)
        {
            var refund = await _context.RefundRequests
                .Include(r => r.Booking)
                    .ThenInclude(b => b.Event)
                .Include(r => r.User)
                .Include(r => r.ProcessedByAdmin)
                .FirstOrDefaultAsync(r => r.Id == refundId);

            if (refund == null)
                throw new Exception("Refund request not found");

            return await MapToRefundRequestDto(refund);
        }

        public async Task<RefundRequestDto> ApproveRefundAsync(Guid refundId, ApproveRefundDto request, Guid adminId)
        {
            var refund = await _context.RefundRequests
                .Include(r => r.Booking)
                    .ThenInclude(b => b.Payment)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == refundId);

            if (refund == null)
                throw new Exception("Refund request not found");

            if (refund.Status != RefundStatus.Pending)
                throw new Exception("Refund request already processed");

            // TODO: Process refund với payment provider
            refund.Status = RefundStatus.Approved;
            refund.AdminNotes = request.Notes;
            refund.ProcessedAt = DateTime.UtcNow;
            refund.ProcessedBy = adminId;
            refund.Booking.Status = BookingStatus.Refunded;

            await _context.SaveChangesAsync();
            await SendRefundApprovalEmail(refund);

            return await MapToRefundRequestDto(refund);
        }

        public async Task<RefundRequestDto> RejectRefundAsync(Guid refundId, RejectRefundDto request, Guid adminId)
        {
            var refund = await _context.RefundRequests
                .Include(r => r.Booking)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == refundId);

            if (refund == null)
                throw new Exception("Refund request not found");

            if (refund.Status != RefundStatus.Pending)
                throw new Exception("Refund request already processed");

            refund.Status = RefundStatus.Rejected;
            refund.AdminNotes = request.Reason;
            refund.ProcessedAt = DateTime.UtcNow;
            refund.ProcessedBy = adminId;
            refund.Booking.Status = BookingStatus.Confirmed;

            await _context.SaveChangesAsync();
            await SendRefundRejectionEmail(refund);

            return await MapToRefundRequestDto(refund);
        }

        public async Task<bool> CanRequestRefundAsync(Guid bookingId, Guid userId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == bookingId && b.UserId == userId);

            if (booking == null) return false;
            if (booking.Status != BookingStatus.Confirmed) return false;

            var hasCompletedPayment = booking.Payments.Any(p => p.Status == PaymentStatus.Completed);
            if (!hasCompletedPayment) return false;

            if (booking.Event.StartDate <= DateTime.UtcNow.AddHours(24)) return false;

            var existingRefund = await _context.RefundRequests
                .Where(r => r.BookingId == bookingId && 
                           (r.Status == RefundStatus.Pending || r.Status == RefundStatus.Approved))
                .FirstOrDefaultAsync();

            return existingRefund == null;
        }

        private async Task<RefundRequestDto> MapToRefundRequestDto(RefundRequest refund)
        {
            var user = await _context.Users.FindAsync(refund.UserId);
            var admin = refund.ProcessedAt.HasValue ? 
                await _context.Users.FindAsync(refund.ProcessedAt.Value) : null;

            return new RefundRequestDto
            {
                Id = refund.Id,
                BookingId = refund.BookingId,
                UserId = refund.UserId,
                UserName = user?.FullName ?? "Người dùng",
                EventName = refund.Booking.Event.Name,
                Amount = refund.Amount,
                Reason = refund.Reason,
                EvidenceUrls = refund.EvidenceUrls,
                Status = refund.Status.ToString(),
                AdminNotes = refund.AdminNotes,
                RequestedAt = refund.RequestedAt,
                ProcessedAt = refund.ProcessedAt,
                ProcessedBy = admin?.FullName
            };
        }

        private async Task SendRefundApprovalEmail(RefundRequest refund)
        {
            // Implementation using EmailService
        }

        private async Task SendRefundRejectionEmail(RefundRequest refund)
        {
            // Implementation using EmailService
        }
    }
}