namespace Tickify.DTOs.Notification
{
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "info"; // info, success, warning, error
        public string Category { get; set; } = "system"; // system, booking, event, payment, promotion
        public bool IsRead { get; set; }
        public string? RelatedEntityType { get; set; } // Event, Booking, Payment, etc.
        public Guid? RelatedEntityId { get; set; }
        public string? ActionUrl { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
    }
}