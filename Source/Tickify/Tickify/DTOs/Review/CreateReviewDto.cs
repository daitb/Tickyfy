using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Review
{
    public class CreateReviewDto
    {
        [Required]
        public Guid EventId { get; set; }
        
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        
        [Required]
        [StringLength(500)]
        public string Comment { get; set; } = string.Empty;
        
        public bool IsAnonymous { get; set; } = false;
    }
}