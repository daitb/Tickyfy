using Tickify.DTOs.Common;

namespace Tickify.DTOs.Refund
{
    public class RefundRequestDto
    {
        public Guid Id { get; set; }
        public string RefundNumber { get; set; } = string.Empty;
        public Guid BookingId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "pending";
        public decimal RequestedAmount { get; set; }
        public decimal ApprovedAmount { get; set; }
        public string RefundMethod { get; set; } = string.Empty;
        
        public BasicUserInfo User { get; set; } = new();
        public BasicUserInfo? ProcessedBy { get; set; }
        public BasicBookingInfo Booking { get; set; } = new();
        
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? RejectionReason { get; set; }
        public string? AdminNotes { get; set; }
    }
}