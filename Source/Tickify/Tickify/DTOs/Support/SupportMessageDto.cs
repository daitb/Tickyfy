using Tickify.DTOs.User;

namespace Tickify.DTOs.Support
{
    public class SupportMessageDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public UserDto? Sender { get; set; }
        public bool IsInternalNote { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> Attachments { get; set; } = new();
    }
}