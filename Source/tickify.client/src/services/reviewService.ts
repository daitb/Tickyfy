import apiClient from "./apiClient";

export interface ReviewDto {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  eventId: number;
  eventTitle: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewDto {
  eventId: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating: number;
  comment?: string;
}

// ===== REVIEW SERVICE =====
class ReviewService {
  /**
   * Create a new review
   */
  async createReview(data: CreateReviewDto): Promise<ReviewDto> {
    const response = await apiClient.post<ReviewDto>("/reviews", data);
    return response.data;
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: number): Promise<ReviewDto> {
    const response = await apiClient.get<ReviewDto>(`/reviews/${reviewId}`);
    return response.data;
  }

  /**
   * Get reviews for an event
   */
  async getEventReviews(eventId: number): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>(`/reviews/event/${eventId}`);
    return response.data;
  }

  /**
   * Get current user's reviews
   */
  async getMyReviews(): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>("/reviews/my-reviews");
    return response.data;
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: number, data: UpdateReviewDto): Promise<ReviewDto> {
    const response = await apiClient.put<ReviewDto>(`/reviews/${reviewId}`, data);
    return response.data;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: number): Promise<void> {
    await apiClient.delete(`/reviews/${reviewId}`);
  }
}

export const reviewService = new ReviewService();
