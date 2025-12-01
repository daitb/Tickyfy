import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Star,
  Upload,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Camera,
  Smile,
  Bold,
  Italic,
  Underline,
  List,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { mockEvents } from '../mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { reviewService } from '../services/reviewService';
import { eventService } from '../services/eventService';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface ReviewSubmissionProps {
  eventId?: string;
  orderId?: string;
  onNavigate: (page: string) => void;
}

const ratingLabels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

const categoryRatings = [
  { id: 'organization', label: 'Organization & Planning' },
  { id: 'venue', label: 'Venue & Facilities' },
  { id: 'value', label: 'Value for Money' },
  { id: 'entertainment', label: 'Entertainment Quality' },
  { id: 'food', label: 'Food & Beverages' },
];

export function ReviewSubmission({ eventId, onNavigate }: ReviewSubmissionProps) {
  const { t } = useTranslation();
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [categoryRatingsState, setCategoryRatingsState] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [allowResponse, setAllowResponse] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [submittedReviewId, setSubmittedReviewId] = useState<number | null>(null);

  // Fetch event data
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!overallRating || !reviewTitle.trim() || !reviewContent.trim()) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    if (!eventId || !event) {
      toast.error('Không tìm thấy thông tin sự kiện');
      return;
    }

    setIsSubmitting(true);

    try {
      // Tạo review với API thật
      const reviewData = {
        eventId: parseInt(eventId, 10),
        rating: overallRating,
        comment: `${reviewTitle}\n\n${reviewContent}`, // Kết hợp title và content
      };

      const createdReview = await reviewService.createReview(reviewData);
      setSubmittedReviewId(createdReview.id);
      setShowSuccess(true);
      toast.success('Đánh giá của bạn đã được gửi thành công!');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi đánh giá';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = overallRating > 0 && reviewTitle.trim() && reviewContent.trim();

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-[700px] mx-auto px-4">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {/* Event Context Header */}
            <div className="flex gap-4 mb-6 pb-6 border-b">
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
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" />
                    <span>Attended on {event.date}</span>
                  </div>
                  <div>{event.venue}</div>
                  <div>{event.city}</div>
                </div>
                <Badge className="bg-green-100 text-green-700 mt-2">Verified Attendee</Badge>
              </div>
            </div>

            {/* Rating Section */}
            <div className="mb-8">
              <h3 className="text-2xl text-neutral-900 mb-4">How was your experience?</h3>
              
              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setOverallRating(rating)}
                    onMouseEnter={() => setHoverRating(rating)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={48}
                      className={
                        rating <= (hoverRating || overallRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              {overallRating > 0 && (
                <div className="text-center">
                  <span className="text-2xl text-yellow-600">
                    {ratingLabels[overallRating - 1]}
                  </span>
                </div>
              )}
            </div>

            {/* Review Form */}
            <div className="space-y-6">
              {/* Review Title */}
              <div>
                <Label htmlFor="title">
                  Review Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  maxLength={100}
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1 text-right">
                  {reviewTitle.length}/100
                </p>
              </div>

              {/* Review Content */}
              <div>
                <Label htmlFor="content">
                  Your Review <span className="text-red-500">*</span>
                </Label>
                
                {/* Formatting Toolbar */}
                <div className="flex gap-1 mt-2 mb-2 p-2 bg-neutral-50 rounded border">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Bold size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Italic size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Underline size={16} />
                  </Button>
                  <Separator orientation="vertical" className="mx-1" />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <List size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Smile size={16} />
                  </Button>
                </div>

                <Textarea
                  id="content"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Share your thoughts about the event..."
                  rows={8}
                  maxLength={1000}
                  className="resize-none"
                />
                <p
                  className={`text-xs mt-1 text-right ${
                    reviewContent.length > 900 ? 'text-orange-500' : 'text-neutral-500'
                  }`}
                >
                  {reviewContent.length}/1000
                </p>
              </div>

              {/* Category Ratings */}
              <div>
                <Label className="mb-3 block">Rate Specific Aspects (Optional)</Label>
                <div className="space-y-4">
                  {categoryRatings.map((category) => (
                    <div key={category.id} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700">{category.label}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() =>
                              setCategoryRatingsState({
                                ...categoryRatingsState,
                                [category.id]: rating,
                              })
                            }
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              size={20}
                              className={
                                rating <= (categoryRatingsState[category.id] || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Photo Upload */}
              <div>
                <Label className="mb-2 block">Add Photos (Optional)</Label>
                <p className="text-xs text-neutral-500 mb-3">
                  Upload up to 5 photos (JPG, PNG, max 5MB each)
                </p>

                {/* Upload Zone */}
                <label
                  htmlFor="photo-upload"
                  className="border-2 border-dashed border-neutral-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors"
                >
                  <Camera className="text-neutral-400 mb-2" size={32} />
                  <p className="text-sm text-neutral-600">Click to upload or drag and drop</p>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Photo Previews */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-5 gap-3 mt-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                        <p className="text-xs text-neutral-500 mt-1 truncate">
                          {(photo.size / 1024).toFixed(0)}KB
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Review Guidelines */}
              <div>
                <button
                  onClick={() => setShowGuidelines(!showGuidelines)}
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                >
                  <span className="text-sm">Review Guidelines</span>
                  {showGuidelines ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showGuidelines && (
                  <div className="mt-3 p-4 bg-neutral-50 rounded-lg space-y-2 text-sm text-neutral-600">
                    <div className="flex gap-2">
                      <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Be honest and constructive in your feedback</span>
                    </div>
                    <div className="flex gap-2">
                      <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Focus on your experience at the event</span>
                    </div>
                    <div className="flex gap-2">
                      <X size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <span>Avoid offensive language or personal attacks</span>
                    </div>
                    <div className="flex gap-2">
                      <X size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <span>Don't share personal information of others</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="anonymous"
                    checked={postAnonymously}
                    onCheckedChange={(checked) => setPostAnonymously(checked as boolean)}
                  />
                  <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                    Post anonymously
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allow-response"
                    checked={allowResponse}
                    onCheckedChange={(checked) => setAllowResponse(checked as boolean)}
                  />
                  <Label htmlFor="allow-response" className="text-sm cursor-pointer">
                    Allow organizer to respond
                  </Label>
                </div>

                <p className="text-xs text-neutral-500">
                  💡 Your review helps others make informed decisions about attending events
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {t('reviewSubmission.submitting')}
                    </>
                  ) : (
                    t('reviewSubmission.submitReview')
                  )}
                </Button>

                <Button variant="outline" className="w-full">
                  Save as Draft
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => onNavigate('my-tickets')}
                    className="text-neutral-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="text-center">
          <DialogHeader>
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="text-green-600" size={32} />
              </div>
            </div>
            <DialogTitle className="text-2xl">{t('reviewSubmission.submitSuccess')}</DialogTitle>
            <DialogDescription>
              {t('reviewSubmission.feedbackHelpful')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-6">
            {eventId && (
              <Button
                onClick={() => {
                  setShowSuccess(false);
                  onNavigate('event-reviews', eventId);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {t('reviewSubmission.viewYourReview')}
              </Button>
            )}
            <Button
              onClick={() => {
                setShowSuccess(false);
                if (eventId) {
                  onNavigate('event-detail', eventId);
                } else {
                  onNavigate('my-tickets');
                }
              }}
              variant="outline"
              className="w-full"
            >
              {eventId ? t('reviewSubmission.backToEvent') : t('reviewSubmission.backToTickets')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
