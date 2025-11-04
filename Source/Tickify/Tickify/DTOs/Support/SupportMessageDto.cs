using Tickify.DTOs.Common;

namespace Tickify.DTOs.Support
{
    public class SupportMessageDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        
        public BasicUserInfo Sender { get; set; } = new();
        public bool IsInternalNote { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> Attachments { get; set; } = new();
    }
}