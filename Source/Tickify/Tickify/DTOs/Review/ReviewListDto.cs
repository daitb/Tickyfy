using Tickify.Common;

namespace Tickify.DTOs.Review
{
    public class ReviewListDto
    {
        public List<ReviewDto> Reviews { get; set; } = new();
        public double AverageRating { get; set; }
        public int TotalCount { get; set; }
        public RatingDistributionDto RatingDistribution { get; set; } = new();
    }

    public class RatingDistributionDto
    {
        public int FiveStar { get; set; }
        public int FourStar { get; set; }
        public int ThreeStar { get; set; }
        public int TwoStar { get; set; }
        public int OneStar { get; set; }
    }
}