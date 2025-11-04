using Tickify.DTOs.Common;

namespace Tickify.DTOs.Waitlist
{
    public class WaitlistDto
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        public Guid TicketTypeId { get; set; }
        public int Quantity { get; set; }
        public int Position { get; set; }
        public string Status { get; set; } = "waiting";
        
        public BasicUserInfo User { get; set; } = new();
        public BasicEventInfo Event { get; set; } = new();
        
        public string? TicketTypeName { get; set; }
        public decimal? TicketTypePrice { get; set; }
        public DateTime JoinedAt { get; set; }
        public DateTime? NotifiedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool HasPurchased { get; set; }
    }
}