import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewService } from '../../services/reviewService';
import apiClient from '../../services/apiClient';

// Mock dependencies
vi.mock('../../services/apiClient');

describe('ReviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('should create review successfully', async () => {
      // Arrange
      const createDto = {
        eventId: 1,
        rating: 5,
        comment: 'Great event!',
      };

      const mockReview = {
        id: 1,
        userId: 1,
        userName: 'Test User',
        eventId: 1,
        eventTitle: 'Test Event',
        rating: 5,
        comment: 'Great event!',
        createdAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockReview,
      } as any);

      // Act
      const result = await reviewService.createReview(createDto);

      // Assert
      expect(result).toEqual(mockReview);
      expect(apiClient.post).toHaveBeenCalledWith('/reviews', createDto);
    });
  });

  describe('getReviewById', () => {
    it('should return review by ID', async () => {
      // Arrange
      const reviewId = 1;
      const mockReview = {
        id: reviewId,
        userId: 1,
        userName: 'Test User',
        eventId: 1,
        eventTitle: 'Test Event',
        rating: 5,
        comment: 'Great event!',
        createdAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockReview,
      } as any);

      // Act
      const result = await reviewService.getReviewById(reviewId);

      // Assert
      expect(result).toEqual(mockReview);
      expect(apiClient.get).toHaveBeenCalledWith(`/reviews/${reviewId}`);
    });
  });

  describe('getEventReviews', () => {
    it('should return reviews for event', async () => {
      // Arrange
      const eventId = 1;
      const mockReviews = [
        {
          id: 1,
          userId: 1,
          userName: 'User 1',
          eventId: 1,
          eventTitle: 'Test Event',
          rating: 5,
          comment: 'Great!',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          userId: 2,
          userName: 'User 2',
          eventId: 1,
          eventTitle: 'Test Event',
          rating: 4,
          comment: 'Good!',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockReviews,
      } as any);

      // Act
      const result = await reviewService.getEventReviews(eventId);

      // Assert
      expect(result).toEqual(mockReviews);
      expect(apiClient.get).toHaveBeenCalledWith(`/reviews/event/${eventId}`);
    });
  });

  describe('getMyReviews', () => {
    it('should return current user reviews', async () => {
      // Arrange
      const mockReviews = [
        {
          id: 1,
          userId: 1,
          userName: 'Test User',
          eventId: 1,
          eventTitle: 'Event 1',
          rating: 5,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockReviews,
      } as any);

      // Act
      const result = await reviewService.getMyReviews();

      // Assert
      expect(result).toEqual(mockReviews);
      expect(apiClient.get).toHaveBeenCalledWith('/reviews/my-reviews');
    });
  });

  describe('updateReview', () => {
    it('should update review successfully', async () => {
      // Arrange
      const reviewId = 1;
      const updateDto = {
        rating: 4,
        comment: 'Updated comment',
      };

      const mockReview = {
        id: reviewId,
        userId: 1,
        userName: 'Test User',
        eventId: 1,
        eventTitle: 'Test Event',
        rating: 4,
        comment: 'Updated comment',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue({
        data: mockReview,
      } as any);

      // Act
      const result = await reviewService.updateReview(reviewId, updateDto);

      // Assert
      expect(result).toEqual(mockReview);
      expect(apiClient.put).toHaveBeenCalledWith(`/reviews/${reviewId}`, updateDto);
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      // Arrange
      const reviewId = 1;
      vi.mocked(apiClient.delete).mockResolvedValue({} as any);

      // Act
      await reviewService.deleteReview(reviewId);

      // Assert
      expect(apiClient.delete).toHaveBeenCalledWith(`/reviews/${reviewId}`);
    });
  });
});

