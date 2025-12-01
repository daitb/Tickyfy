import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ChevronDown,
  Camera,
  X,
  Search,
  Filter,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { mockEvents } from '../mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { reviewService, type ReviewDto } from '../services/reviewService';
import { eventService } from '../services/eventService';
import { useEffect } from 'react';

interface EventReviewsProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

// Sử dụng ReviewDto từ service, nhưng extend thêm các field UI cần
interface Review extends ReviewDto {
  isVerified?: boolean;
  attendedDate?: string;
  title?: string;
  photos?: string[];
  categoryRatings?: {
    organization: number;
    venue: number;
    value: number;
    entertainment: number;
  };
  helpfulCount?: number;
  notHelpfulCount?: number;
  userVote?: 'helpful' | 'not-helpful';
  organizerResponse?: {
    text: string;
    date: string;
    organizerName: string;
  };
}


export function EventReviews({ eventId, onNavigate }: EventReviewsProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showPhotosOnly, setShowPhotosOnly] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  // Fetch event details
  useEffect(() => {
    let mounted = true;
    if (eventId) {
      eventService.getEventByIdentifier(eventId)
        .then((ev) => {
          if (mounted) setEvent(ev);
        })
        .catch(() => {
          // Fallback to mock data if API fails
          if (mounted) {
            const mockEvent = mockEvents.find((e) => e.id === eventId) || mockEvents[0];
            setEvent(mockEvent);
          }
        });
    } else {
      const mockEvent = mockEvents[0];
      setEvent(mockEvent);
    }
    return () => { mounted = false; };
  }, [eventId]);

  // Fetch reviews
  useEffect(() => {
    let mounted = true;
    const fetchReviews = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        const eventReviews = await reviewService.getEventReviews(parseInt(eventId, 10));
        
        if (!mounted) return;

        // Map ReviewDto to Review interface
        const mappedReviews: Review[] = eventReviews.map((r) => ({
          ...r,
          isVerified: true, // TODO: Add verification logic from backend
          attendedDate: r.createdAt, // Use createdAt as attended date for now
          title: r.comment ? r.comment.substring(0, 50) : undefined,
          content: r.comment || '',
          helpfulCount: 0, // TODO: Add helpful count from backend
          notHelpfulCount: 0, // TODO: Add not helpful count from backend
        }));

        setReviews(mappedReviews);

        // Calculate average rating
        if (eventReviews.length > 0) {
          const avg = eventReviews.reduce((sum, r) => sum + r.rating, 0) / eventReviews.length;
          setAverageRating(avg);
          setTotalReviews(eventReviews.length);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        if (mounted) {
          // Fallback to empty state
          setReviews([]);
          setAverageRating(0);
          setTotalReviews(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchReviews();
    return () => { mounted = false; };
  }, [eventId]);

  // Filter and sort reviews
  const filteredReviews = reviews.filter((review) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        review.comment?.toLowerCase().includes(query) ||
        review.userName.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Rating filter
    if (filterRating !== 'all') {
      if (filterRating === 'below3') {
        if (review.rating >= 3) return false;
      } else if (filterRating === 'threePlusStars') {
        if (review.rating < 3) return false;
      } else if (filterRating === 'fourFiveStars') {
        if (review.rating < 4) return false;
      } else if (filterRating === '5') {
        if (review.rating !== 5) return false;
      }
    }

    // Verified filter
    if (showVerifiedOnly && !review.isVerified) return false;

    // Photos filter
    if (showPhotosOnly && (!review.photos || review.photos.length === 0)) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'highest') {
      return b.rating - a.rating;
    } else if (sortBy === 'lowest') {
      return a.rating - b.rating;
    } else if (sortBy === 'helpful') {
      const aHelpful = (a.helpfulCount || 0) - (a.notHelpfulCount || 0);
      const bHelpful = (b.helpfulCount || 0) - (b.notHelpfulCount || 0);
      return bHelpful - aHelpful;
    }
    return 0;
  });

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, percentage };
  });

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2>{t('events.eventNotFound')}</h2>
          <Button onClick={() => onNavigate('home')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const toggleExpanded = (reviewId: number) => {
    const idStr = reviewId.toString();
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(idStr)) {
      newExpanded.delete(idStr);
    } else {
      newExpanded.add(idStr);
    }
    setExpandedReviews(newExpanded);
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

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = { sm: 14, md: 18, lg: 24 };
    const starSize = sizeMap[size];
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const handleVote = (reviewId: number, voteType: 'helpful' | 'not-helpful') => {
    // TODO: Implement voting logic when backend API is available
  };

  const handleReport = () => {
    // TODO: Implement report logic when backend API is available
    setReportReviewId(null);
    setReportReason('');
    setReportDetails('');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Event Context Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('event-detail', event.id)}
            className="mb-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            {t('eventReviews.backToEvent')}
          </Button>

          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                  <ImageWithFallback
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-neutral-900 mb-2">{event.title}</h2>
                  <div className="space-y-1 text-sm text-neutral-600">
                    <div>{event.date}</div>
                    <div>{event.venue}</div>
                  </div>
                  <Button
                    variant="link"
                    onClick={() => onNavigate('event-detail', event.id)}
                    className="p-0 h-auto text-purple-600 mt-2"
                  >
                    {t('eventReviews.viewEventDetails')} →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-5 gap-6">
              {/* Left: Overall Rating */}
              <div className="md:col-span-2 text-center md:text-left">
                <div className="text-6xl mb-2">{averageRating.toFixed(1)}</div>
                {renderStars(Math.round(averageRating), 'lg')}
                <p className="text-neutral-600 mt-2">{t('eventReviews.basedOn')} {totalReviews} {t('eventReviews.reviewsCount')}</p>
                <Badge className="bg-green-100 text-green-700 mt-2">{t('eventReviews.excellent')}</Badge>
                <p className="text-xs text-neutral-500 mt-2">{t('eventReviews.updatedToday')}</p>
              </div>

              {/* Right: Rating Distribution */}
              <div className="md:col-span-3 space-y-2">
                {ratingDistribution.map((item) => (
                  <button
                    key={item.stars}
                    onClick={() => setFilterRating(item.stars.toString())}
                    className="w-full flex items-center gap-3 text-sm hover:bg-neutral-50 p-2 rounded transition-colors"
                  >
                    <span className="w-8">{item.stars}★</span>
                    <div className="flex-1">
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                    <span className="w-16 text-right text-neutral-600">
                      {item.count} ({item.percentage}%)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Ratings */}
            <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-neutral-600 mb-1">{t('eventReviews.organization')}</div>
                {renderStars(5, 'sm')}
                <div className="text-sm mt-1">4.5</div>
              </div>
              <div>
                <div className="text-sm text-neutral-600 mb-1">{t('eventReviews.venue')}</div>
                {renderStars(5, 'sm')}
                <div className="text-sm mt-1">4.7</div>
              </div>
              <div>
                <div className="text-sm text-neutral-600 mb-1">{t('eventReviews.value')}</div>
                {renderStars(4, 'sm')}
                <div className="text-sm mt-1">4.3</div>
              </div>
              <div>
                <div className="text-sm text-neutral-600 mb-1">{t('eventReviews.entertainment')}</div>
                {renderStars(5, 'sm')}
                <div className="text-sm mt-1">5.0</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Write Review CTA */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-purple-100 text-purple-600">U</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-neutral-900 mb-1">{t('eventReviews.shareExperience')}</h3>
                  <p className="text-sm text-neutral-600">{t('eventReviews.writeReviewCTA')}</p>
                </div>
              </div>
              <Button
                onClick={() => onNavigate('review-submission', event.id)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {t('eventReviews.writeReview')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters & Search */}
        <div className="mb-6 space-y-4">
          {/* Search & Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('eventReviews.searchReviews')}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t('eventReviews.mostRecent')}</SelectItem>
                <SelectItem value="helpful">{t('eventReviews.mostHelpful')}</SelectItem>
                <SelectItem value="highest">{t('eventReviews.highestRated')}</SelectItem>
                <SelectItem value="lowest">{t('eventReviews.lowestRated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showVerifiedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
              className={showVerifiedOnly ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <CheckCircle size={14} className="mr-2" />
              {t('eventReviews.verifiedOnly')}
            </Button>
            <Button
              variant={showPhotosOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowPhotosOnly(!showPhotosOnly)}
              className={showPhotosOnly ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <Camera size={14} className="mr-2" />
              {t('eventReviews.withPhotos')}
            </Button>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('eventReviews.allRatings')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('eventReviews.allRatings')}</SelectItem>
                <SelectItem value="5">{t('eventReviews.fiveStarsOnly')}</SelectItem>
                <SelectItem value="4">{t('eventReviews.fourFiveStars')}</SelectItem>
                <SelectItem value="3">{t('eventReviews.threePlusStars')}</SelectItem>
                <SelectItem value="below3">{t('eventReviews.belowThreeStars')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-neutral-500">{t('common.loading')}...</div>
            </CardContent>
          </Card>
        )}

        {/* No Reviews State */}
        {!loading && filteredReviews.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Star className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {searchQuery || filterRating !== 'all' 
                    ? t('common.noResults')
                    : t('eventReviews.noReviewsYet')}
                </h3>
                <p className="text-sm text-neutral-600">
                  {searchQuery || filterRating !== 'all'
                    ? t('eventReviews.tryDifferentFilters')
                    : t('eventReviews.beFirstToReview')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        {!loading && filteredReviews.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-neutral-600 mb-4">
              {t('eventReviews.showing')} 1-{filteredReviews.length} {t('eventReviews.of')} {totalReviews} {t('eventReviews.reviewsCount')}
            </div>

            {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <Avatar className="w-12 h-12">
                      {review.authorAvatar ? (
                        <AvatarImage src={review.authorAvatar} />
                      ) : (
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {review.authorName.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-900">{review.authorName}</span>
                        {review.isVerified && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle size={12} className="mr-1" />
                            {t('eventReviews.verified')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-neutral-500">{formatDate(review.createdAt)}</div>
                      {review.attendedDate && (
                        <div className="text-xs text-neutral-500">{t('eventReviews.attendedOn')} {formatDate(review.attendedDate)}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h3 className="text-neutral-900 mb-2">{review.title}</h3>
                )}

                {/* Review Content */}
                {review.comment && (
                  <div className="text-neutral-700 mb-4">
                    <p className={expandedReviews.has(review.id.toString()) ? '' : 'line-clamp-3'}>
                      {review.comment}
                    </p>
                    {review.comment.length > 300 && (
                      <button
                        onClick={() => toggleExpanded(review.id)}
                        className="text-purple-600 hover:text-purple-700 text-sm mt-1"
                      >
                        {expandedReviews.has(review.id.toString()) ? t('eventReviews.showLess') : t('eventReviews.readMore')}
                      </button>
                    )}
                  </div>
                )}

                {/* Category Ratings */}
                {review.categoryRatings && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
                      {t('eventReviews.categoryRatings')}
                      <ChevronDown size={18} />
                    </summary>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 ml-4">
                      <div className="text-sm">
                        <div className="text-neutral-600">{t('eventReviews.organization')}</div>
                        {renderStars(review.categoryRatings.organization, 'sm')}
                      </div>
                      <div className="text-sm">
                        <div className="text-neutral-600">{t('eventReviews.venue')}</div>
                        {renderStars(review.categoryRatings.venue, 'sm')}
                      </div>
                      <div className="text-sm">
                        <div className="text-neutral-600">{t('eventReviews.value')}</div>
                        {renderStars(review.categoryRatings.value, 'sm')}
                      </div>
                      <div className="text-sm">
                        <div className="text-neutral-600">{t('eventReviews.entertainment')}</div>
                        {renderStars(review.categoryRatings.entertainment, 'sm')}
                      </div>
                    </div>
                  </details>
                )}

                {/* Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.photos.slice(0, 4).map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 hover:opacity-75 transition-opacity"
                      >
                        <img src={photo} alt={`Review ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {review.photos.length > 4 && (
                      <div className="w-24 h-24 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
                        +{review.photos.length - 4}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <span className="text-sm text-neutral-600">{t('eventReviews.wasHelpful')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(review.id, 'helpful')}
                    className={review.userVote === 'helpful' ? 'bg-blue-50' : ''}
                  >
                    <ThumbsUp size={14} className="mr-1" />
                    {review.helpfulCount || 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(review.id, 'not-helpful')}
                    className={review.userVote === 'not-helpful' ? 'bg-red-50' : ''}
                  >
                    <ThumbsDown size={14} className="mr-1" />
                    {review.notHelpfulCount || 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportReviewId(review.id.toString())}
                    className="ml-auto"
                  >
                    <Flag size={14} className="mr-1" />
                    {t('eventReviews.report')}
                  </Button>
                </div>

                {/* Organizer Response */}
                {review.organizerResponse && (
                  <div className="mt-4 ml-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-700">Orgnaizer</Badge>
                      <span className="text-sm text-neutral-500">{review.organizerResponse.date}</span>
                    </div>
                    <p className="text-sm text-neutral-700">{review.organizerResponse.text}</p>
                    <div className="text-xs text-neutral-500 mt-2">
                      — {review.organizerResponse.organizerName}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <div className="relative">
            <img src={selectedPhoto || ''} alt="Review" className="w-full rounded-lg" />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reportReviewId} onOpenChange={() => setReportReviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('eventReviews.reportReview')}</DialogTitle>
            <DialogDescription>
              {t('eventReviews.reportDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-neutral-700 mb-2 block">{t('eventReviews.reasonForReport')}</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder={t('eventReviews.selectReason')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate">{t('eventReviews.inappropriate')}</SelectItem>
                  <SelectItem value="spam">{t('eventReviews.spam')}</SelectItem>
                  <SelectItem value="fake">{t('eventReviews.fakeReview')}</SelectItem>
                  <SelectItem value="offtopic">{t('eventReviews.offTopic')}</SelectItem>
                  <SelectItem value="other">{t('eventReviews.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-neutral-700 mb-2 block">{t('eventReviews.additionalDetails')}</label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={t('eventReviews.provideMoreInfo')}
                rows={4}
              />
            </div>

            <p className="text-xs text-neutral-500">
              {t('eventReviews.reviewTime')}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportReviewId(null)}>
              {t('eventReviews.cancel')}
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason}
              className="bg-red-500 hover:bg-red-600"
            >
              {t('eventReviews.submitReport')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
