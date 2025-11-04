using Tickify.DTOs.User;

namespace Tickify.DTOs.Payout
{
    public class PayoutDto
    {
        public Guid Id { get; set; }
        public string PayoutNumber { get; set; } = string.Empty;
        public Guid OrganizerId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "VND";
        public string Status { get; set; } = "pending"; // pending, approved, processing, completed, failed
        public string PayoutMethod { get; set; } = "bank_transfer"; // bank_transfer, ewallet
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountHolderName { get; set; }
        public string? TransactionId { get; set; }
        public UserDto? Organizer { get; set; }
        public UserDto? ProcessedBy { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? FailureReason { get; set; }
        public string? AdminNotes { get; set; }
        
        // Related events for this payout
        public List<Guid> EventIds { get; set; } = new();
        public int EventCount { get; set; }
    }
}