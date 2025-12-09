namespace Tickify.DTOs.Review
{
public sealed class UpdateReviewDto
{
    public int Rating { get; set; } // 1..5
    public string? Comment { get; set; }
}
}