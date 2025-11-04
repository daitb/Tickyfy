using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Support
{
    public class CreateSupportTicketDto
    {
        [Required]
        [StringLength(100)]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public string Category { get; set; } = "general"; // general, technical, payment, refund, event
        
        public string? RelatedEventId { get; set; }
        public string? RelatedBookingId { get; set; }
        
        [Required]
        public string Priority { get; set; } = "medium"; // low, medium, high, urgent
    }
}