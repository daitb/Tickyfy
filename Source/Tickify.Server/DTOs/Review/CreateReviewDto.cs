using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Review
{
public sealed class CreateReviewDto
{
    public int EventId { get; set; }
    public int Rating { get; set; } // 1..5
    public string? Comment { get; set; }
}
}