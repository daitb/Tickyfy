namespace Tickify.DTOs.Review;

public class CreateReviewDto
{
    public int EventId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
