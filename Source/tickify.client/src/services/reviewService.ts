// services/reviewService.ts
import apiClient from "./apiClient";

export interface Review {
  id: number;
  userId: number;
  eventId: number;
  rating: number; // 1-5
  comment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Lấy danh sách review theo Event
 * GET /api/review/event/{eventId}
 */
export async function getReviewsByEvent(eventId: number) {
  const res = await apiClient.get<Review[]>(`/review/event/${eventId}`);
  return res.data;
}

/**
 * User tạo review
 * POST /api/review
 */
export async function createReview(body: {
  eventId: number;
  rating: number;
  comment?: string;
}) {
  const res = await apiClient.post<Review>("/review", body);
  return res.data;
}

/**
 * User xem review của chính mình
 * GET /api/review/my
 */
export async function getMyReviews() {
  const res = await apiClient.get<Review[]>("/review/my");
  return res.data;
}

/**
 * User cập nhật review của mình
 * PUT /api/review/{id}
 */
export async function updateMyReview(
  id: number,
  body: { rating: number; comment?: string }
) {
  const res = await apiClient.put<Review>(`/review/${id}`, body);
  return res.data;
}

/**
 * User xoá review của mình
 * DELETE /api/review/{id}
 */
export async function deleteMyReview(id: number) {
  await apiClient.delete(`/review/${id}`);
}
