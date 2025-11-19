// services/refundService.ts
import apiClient from "./apiClient";

export type RefundStatus = "Pending" | "Approved" | "Rejected" | "Processed";

export interface RefundRequest {
  id: number;
  bookingId: number;
  userId: number;
  reason: string;
  refundAmount: number;
  status: RefundStatus;
  reviewedByStaffId?: number | null;
  reviewedAt?: string | null;
  staffNotes?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

/**
 * User tạo yêu cầu hoàn tiền
 * POST /api/refund/request
 */
export async function createRefundRequest(body: {
  bookingId: number;
  refundAmount: number;
  reason: string;
}) {
  const res = await apiClient.post<RefundRequest>("/refund/request", body);
  return res.data;
}

/**
 * User xem danh sách yêu cầu hoàn tiền của mình
 * GET /api/refund/my-refunds
 */
export async function getMyRefundRequests() {
  const res = await apiClient.get<RefundRequest[]>("/refund/my-refunds");
  return res.data;
}

/**
 * Staff/Admin xem toàn bộ refund (tuỳ backend bạn có endpoint)
 * GET /api/refund
 */
export async function getAllRefundRequests() {
  const res = await apiClient.get<RefundRequest[]>("/refund");
  return res.data;
}

/**
 * Staff/Admin duyệt refund
 * POST /api/refund/{id}/approve
 */
export async function approveRefund(id: number, staffNotes?: string) {
  const res = await apiClient.post<RefundRequest>(`/refund/${id}/approve`, {
    staffNotes,
  });
  return res.data;
}

/**
 * Staff/Admin từ chối refund
 * POST /api/refund/{id}/reject
 */
export async function rejectRefund(id: number, reason: string) {
  const res = await apiClient.post<RefundRequest>(`/refund/${id}/reject`, {
    reason,
  });
  return res.data;
}

/**
 * Lấy chi tiết 1 refund
 * GET /api/refund/{id}
 */
export async function getRefundById(id: number) {
  const res = await apiClient.get<RefundRequest>(`/refund/${id}`);
  return res.data;
}
