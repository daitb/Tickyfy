using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Support
{
    public class AddMessageDto
    {
        [Required]
        [StringLength(2000)]
        public string Content { get; set; } = string.Empty;
        
        public bool IsInternalNote { get; set; } = false;
    }
}