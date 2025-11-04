using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Waitlist
{
    public class JoinWaitlistDto
    {
        [Required]
        public Guid EventId { get; set; }
        
        [Required]
        public Guid TicketTypeId { get; set; }
        
        [Range(1, 10)]
        public int Quantity { get; set; } = 1;
        
        [EmailAddress]
        public string? NotificationEmail { get; set; } // Optional different email for notifications
    }
}