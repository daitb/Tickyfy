namespace Tickify.Models
{
    public class Seat
    {
        public int Id { get; set; }
        public int TicketTypeId { get; set; }
        public string Row { get; set; } = string.Empty;
        public string SeatNumber { get; set; } = string.Empty;
        public string FullSeatCode => $"{Row}{SeatNumber}";
        public bool IsAvailable { get; set; } = true;
        public bool IsBlocked { get; set; } = false;
        public string? BlockedReason { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public TicketType TicketType { get; set; } = null!;
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
