namespace Tickify.Models
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // Admin, Staff, Organizer, Customer
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
