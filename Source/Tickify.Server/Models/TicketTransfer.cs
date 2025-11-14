namespace Tickify.Models
{
    public class TicketTransfer
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int FromUserId { get; set; }
        public int ToUserId { get; set; }
        public DateTime TransferredAt { get; set; } = DateTime.UtcNow;
        public string? Reason { get; set; }
        public bool IsApproved { get; set; } = true;
        public int? ApprovedByUserId { get; set; }

        // Navigation properties
        public Ticket Ticket { get; set; } = null!;
        public User FromUser { get; set; } = null!;
        public User ToUser { get; set; } = null!;
        public User? ApprovedByUser { get; set; }
    }
}
