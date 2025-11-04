using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Notification
{
    public class CreateNotificationDto
    {
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [StringLength(500)]
        public string Message { get; set; } = string.Empty;
        
        [Required]
        public string Type { get; set; } = "info";
        
        [Required]
        public string Category { get; set; } = "system";
        
        public Guid? UserId { get; set; } // Null for broadcast to all users
        public string? RelatedEntityType { get; set; }
        public Guid? RelatedEntityId { get; set; }
        public string? ActionUrl { get; set; }
        public string? ImageUrl { get; set; }
        
        // For bulk notifications to specific user groups
        public List<Guid>? UserIds { get; set; }
        public string? UserRole { get; set; } // Send to all users with specific role
    }
}