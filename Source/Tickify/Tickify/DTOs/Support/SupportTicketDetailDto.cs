using Tickify.DTOs.User;

namespace Tickify.DTOs.Support
{
    public class SupportTicketDetailDto : SupportTicketDto
    {
        public string Description { get; set; } = string.Empty;
        public List<SupportMessageDto> Messages { get; set; } = new();
        public string? ResolutionNotes { get; set; }
        public string? RelatedEventTitle { get; set; }
        public string? RelatedBookingCode { get; set; }
    }
}