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
        [StringLength(1000)]
        public string Comment { get; set; } = string.Empty;
        
        public List<string>? ImageUrls { get; set; }
        public bool IsAnonymous { get; set; } = false;
    }

    public class UpdateReviewDto
    {
        [Range(1, 5)]
        public int? Rating { get; set; }
        
        [StringLength(1000)]
        public string? Comment { get; set; }
        
        public List<string>? ImageUrls { get; set; }
        public bool? IsAnonymous { get; set; }
    }
}