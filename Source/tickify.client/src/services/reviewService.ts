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
    const response = await apiClient.post<ReviewDto>("/Review", data);
    return response.data;
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: number): Promise<ReviewDto> {
    const response = await apiClient.get<ReviewDto>(`/Review/${reviewId}`);
    return response.data;
  }

  /**
   * Get reviews for an event
   */
  async getEventReviews(eventId: number): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>(`/Review/event/${eventId}`);
    return response.data;
  }

  /**
   * Get current user's reviews
   */
  async getMyReviews(): Promise<ReviewDto[]> {
    const response = await apiClient.get<ReviewDto[]>("/Review/my-reviews");
    return response.data;
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: number, data: UpdateReviewDto): Promise<ReviewDto> {
    const response = await apiClient.put<ReviewDto>(`/Review/${reviewId}`, data);
    return response.data;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: number): Promise<void> {
    await apiClient.delete(`/Review/${reviewId}`);
  }
}

export const reviewService = new ReviewService();
