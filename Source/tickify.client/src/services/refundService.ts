// services/refundService.ts
import apiClient from "./apiClient";

export type RefundStatus = "Pending" | "Approved" | "Rejected" | "Processed";

export interface RefundRequest {
  id: number;
  refundId?: number; // Backend returns RefundId
  bookingId: number;
  bookingNumber?: string;
  userId: number;
  userName?: string;
  eventTitle?: string;
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
 * Transform backend response to match frontend interface
 */
function transformRefundResponse(data: any): RefundRequest {
  return {
    ...data,
    id: data.refundId || data.id,
    refundId: data.refundId,
  };
}

// POST /api/refund/request

export async function createRefundRequest(body: {
  bookingId: number;
  refundAmount: number;
  reason: string;
}) {
  const res = await apiClient.post<RefundRequest>("/refunds/request", body);
  return res.data;
}

// GET /api/refund/my-refunds

export async function getMyRefundRequests() {
  const res = await apiClient.get<any[]>("/refunds/my-refunds");
  return res.data.map(transformRefundResponse);
}

// GET /api/refund
 
export async function getAllRefundRequests() {
  const res = await apiClient.get<any[]>("/refunds");
  return res.data.map(transformRefundResponse);
}

// POST /api/refund/{id}/approve

export async function approveRefund(id: number, staffNotes?: string) {
  const res = await apiClient.post<any>(`/refunds/${id}/approve`, {
    staffNotes,
  });
  return transformRefundResponse(res.data);
}

// POST /api/refund/{id}/reject
 
export async function rejectRefund(id: number, reason: string) {
  const res = await apiClient.post<any>(`/refunds/${id}/reject`, {
    reason,
  });
  return transformRefundResponse(res.data);
}

// GET /api/refund/{id}

export async function getRefundById(id: number) {
  const res = await apiClient.get<any>(`/refunds/${id}`);
  return transformRefundResponse(res.data);
}
