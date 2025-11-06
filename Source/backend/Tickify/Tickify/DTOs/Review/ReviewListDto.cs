namespace Tickify.DTOs.Review
{
    public class ReviewListDto
    {
        public List<ReviewDto> Reviews { get; set; } = new();
        public double AverageRating { get; set; }
        public int TotalCount { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new();
    }
}