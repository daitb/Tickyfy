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

    public class ReviewDto
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserAvatar { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = new();
        public bool IsAnonymous { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsVerified { get; set; } // User đã tham gia event
    }

    public class ReviewListDto
    {
        public List<ReviewDto> Reviews { get; set; } = new();
        public double AverageRating { get; set; }
        public int TotalCount { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new();
    }
}