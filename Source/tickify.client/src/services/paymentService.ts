// services/paymentService.ts
import apiClient from "./apiClient";

export interface PaymentIntent {
  provider: string;
  paymentId: number;
  redirectUrl: string;
  expiresAtUtc: string;
}

export type PaymentProvider = "momo" | "vnpay";

/**
 * Tạo Payment Intent – backend sẽ trả về redirectUrl để FE chuyển người dùng
 */
export async function createPaymentIntent(body: {
  bookingId: number;
  provider: PaymentProvider;
}) {
  // Map frontend provider names to backend expected format
  const providerMap: { [key in PaymentProvider]: string } = {
    momo: "MoMo",
    vnpay: "VNPay",
  };

  const res = await apiClient.post<PaymentIntent>("/payment/create-intent", {
    bookingId: body.bookingId,
    provider: providerMap[body.provider],
  });

  return res.data; // đã unwrap từ ApiResponse
}

/**
 * Gọi verify sau khi thanh toán (dành cho trường hợp ReturnUrl FE cần confirm)
 */
export async function verifyPayment(paymentId: number) {
  const res = await apiClient.post<{ success: boolean }>(
    `/payment/${paymentId}/verify`
  );
  // ApiResponse wrapper is already unwrapped by interceptor, so res.data is { success: boolean }
  return res.data.success;
}

/**
 * Verify payment from return URL parameters (when webhook is not received)
 * This is more reliable for localhost development where webhooks can't reach the server
 */
export async function verifyPaymentFromReturnUrl(paymentId: number, queryParams: URLSearchParams) {
  // Convert URLSearchParams to query string
  const queryString = queryParams.toString();
  const res = await apiClient.post<{ success: boolean }>(
    `/payment/${paymentId}/verify-return-url${queryString ? `?${queryString}` : ''}`
  );
  return res.data.success;
}

/**
 * Lấy danh sách payment theo booking
 */
export async function getPaymentsByBooking(bookingId: number) {
  const res = await apiClient.get(`/payment/booking/${bookingId}`);
  return res.data;
}

/**
 * Lấy thông tin 1 payment
 */
export async function getPaymentById(paymentId: number) {
  const res = await apiClient.get(`/payment/${paymentId}`);
  return res.data;
}
