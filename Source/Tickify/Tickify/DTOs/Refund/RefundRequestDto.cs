using Tickify.DTOs.Booking;
using Tickify.DTOs.User;

namespace Tickify.DTOs.Refund
{
    public class RefundRequestDto
    {
        public Guid Id { get; set; }
        public string RefundNumber { get; set; } = string.Empty;
        public Guid BookingId { get; set; }
        public Guid UserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "pending"; // pending, approved, rejected, processing, completed, failed
        public decimal RequestedAmount { get; set; }
        public decimal ApprovedAmount { get; set; }
        public string RefundMethod { get; set; } = string.Empty;
        public UserDto? User { get; set; }
        public BookingDto? Booking { get; set; }
        public UserDto? ProcessedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? RejectionReason { get; set; }
        public string? AdminNotes { get; set; }
    }
}