import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { reviewService, type ReviewDto } from '../../services/reviewService';

interface EventReviewsSummaryProps {
  eventId: number;
  averageRating?: number;
  totalReviews?: number;
  onViewAll: () => void;
}

/**
 * Component hiển thị summary reviews của event
 * Hiển thị rating trung bình, số lượng reviews và 3 reviews mới nhất
 */
export default function EventReviewsSummary({
  eventId,
  averageRating: propAverageRating,
  totalReviews: propTotalReviews,
  onViewAll,
}: EventReviewsSummaryProps) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const eventReviews = await reviewService.getEventReviews(eventId);
        
        if (!mounted) return;

        // Lấy 3 reviews mới nhất
        const latestReviews = eventReviews.slice(0, 3);
        setReviews(latestReviews);

        // Tính toán rating trung bình và tổng số reviews
        if (eventReviews.length > 0) {
          const avg = eventReviews.reduce((sum, r) => sum + r.rating, 0) / eventReviews.length;
          setAverageRating(avg);
          setTotalReviews(eventReviews.length);
        } else {
          setAverageRating(propAverageRating || 0);
          setTotalReviews(propTotalReviews || 0);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        if (mounted) {
          setAverageRating(propAverageRating || 0);
          setTotalReviews(propTotalReviews || 0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      mounted = false;
    };
  }, [eventId, propAverageRating, propTotalReviews]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('common.today');
    if (diffDays === 1) return t('common.yesterday');
    if (diffDays < 7) return `${diffDays} ${t('common.daysAgo')}`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${t('common.weeksAgo')}`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${t('common.monthsAgo')}`;
    }
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-neutral-500">{t('common.loading')}...</div>
        </CardContent>
      </Card>
    );
  }

  // Nếu không có reviews
  if (totalReviews === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Star className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {t('eventReviews.noReviewsYet')}
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              {t('eventReviews.beFirstToReview')}
            </p>
            <Button onClick={onViewAll} variant="outline">
              {t('eventReviews.writeReview')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header với rating summary */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {t('eventReviews.reviews')}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold text-neutral-900">
                  {averageRating.toFixed(1)}
                </span>
                {renderStars(Math.round(averageRating))}
              </div>
              <div className="text-sm text-neutral-600">
                {totalReviews} {t('eventReviews.reviewsCount')}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onViewAll}
            className="flex items-center gap-2"
          >
            {t('eventReviews.viewAll')}
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Preview reviews */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-t pt-4 first:border-t-0 first:pt-0">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  {review.userAvatar ? (
                    <AvatarImage src={review.userAvatar} />
                  ) : (
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {review.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        {review.userName}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-neutral-700 mt-2 line-clamp-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all button ở cuối nếu có nhiều reviews */}
        {totalReviews > 3 && (
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={onViewAll}
              className="w-full flex items-center justify-center gap-2"
            >
              {t('eventReviews.viewAllReviews')} ({totalReviews})
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

