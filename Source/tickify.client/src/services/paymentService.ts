// services/paymentService.ts
import apiClient from "./apiClient";

export interface PaymentIntent {
  provider: string;
  paymentId: number;
  redirectUrl: string;
  expiresAtUtc: string;
}

export type PaymentProvider = "momo" | "vnpay" | "creditcard";

export interface CreditCardDetails {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

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
    creditcard: "creditcard",
  };

  const res = await apiClient.post<PaymentIntent>("/payments/create-intent", {
    bookingId: body.bookingId,
    provider: providerMap[body.provider],
  });

  return res.data; // đã unwrap từ ApiResponse
}

/**
 * Tạo Credit Card Payment Intent với validation thông tin thẻ
 */
export async function createCreditCardPaymentIntent(body: {
  bookingId: number;
  cardDetails: CreditCardDetails;
}) {
  const res = await apiClient.post<PaymentIntent>(
    "/payments/create-credit-card-intent",
    {
      bookingId: body.bookingId,
      provider: "creditcard",
      cardNumber: body.cardDetails.cardNumber.replace(/\s/g, ""), // Remove spaces
      cardholderName: body.cardDetails.cardholderName,
      expiryMonth: body.cardDetails.expiryMonth,
      expiryYear: body.cardDetails.expiryYear,
      cvv: body.cardDetails.cvv,
    }
  );

  return res.data;
}

/**
 * Gọi verify sau khi thanh toán (dành cho trường hợp ReturnUrl FE cần confirm)
 */
export async function verifyPayment(paymentId: number) {
  const res = await apiClient.post<{ success: boolean }>(
    `/payments/${paymentId}/verify`
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
    `/payments/${paymentId}/verify-return-url${queryString ? `?${queryString}` : ''}`
  );
  return res.data.success;
}

/**
 * Lấy danh sách payment theo booking
 */
export async function getPaymentsByBooking(bookingId: number) {
  const res = await apiClient.get(`/payments/booking/${bookingId}`);
  return res.data;
}

/**
 * Lấy thông tin 1 payment
 */
export async function getPaymentById(paymentId: number) {
  const res = await apiClient.get(`/payments/${paymentId}`);
  return res.data;
}
