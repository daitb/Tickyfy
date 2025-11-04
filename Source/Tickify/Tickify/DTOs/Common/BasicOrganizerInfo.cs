namespace Tickify.DTOs.Common
{
    public class BasicOrganizerInfo
    {
        public Guid Id { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? Website { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public bool IsVerified { get; set; }
        public decimal Rating { get; set; }
        public int TotalEvents { get; set; }
    }
}