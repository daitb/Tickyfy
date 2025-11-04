namespace Tickify.DTOs.Common
{
    public class BasicBookingInfo
    {
        public Guid Id { get; set; }
        public string BookingCode { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty; // pending, confirmed, cancelled, expired, refunded
        public int TicketCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }
}