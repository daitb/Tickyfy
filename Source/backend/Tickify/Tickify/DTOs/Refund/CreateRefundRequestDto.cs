using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Refund
{
    public class CreateRefundRequestDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;
        
        public List<string>? EvidenceUrls { get; set; }
    }

    public class RefundRequestDto
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string EventName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public List<string> EvidenceUrls { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public string? AdminNotes { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? ProcessedBy { get; set; }
    }

    public class ApproveRefundDto
    {
        [StringLength(1000)]
        public string? Notes { get; set; }
    }

    public class RejectRefundDto
    {
        [Required]
        [StringLength(1000)]
        public string Reason { get; set; } = string.Empty;
    }
}