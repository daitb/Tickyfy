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

export async function createPaymentIntent(body: {
  bookingId: number;
  provider: PaymentProvider;
}) {
  const providerMap: { [key in PaymentProvider]: string } = {
    momo: "MoMo",
    vnpay: "VNPay",
    creditcard: "creditcard",
  };

  const res = await apiClient.post<PaymentIntent>("/payments/create-intent", {
    bookingId: body.bookingId,
    provider: providerMap[body.provider],
  });

  return res.data;
}

export async function createCreditCardPaymentIntent(body: {
  bookingId: number;
  cardDetails: CreditCardDetails;
}) {
  const res = await apiClient.post<PaymentIntent>(
    "/payments/create-credit-card-intent",
    {
      bookingId: body.bookingId,
      provider: "creditcard",
      cardNumber: body.cardDetails.cardNumber.replace(/\s/g, ""),
      cardholderName: body.cardDetails.cardholderName,
      expiryMonth: body.cardDetails.expiryMonth,
      expiryYear: body.cardDetails.expiryYear,
      cvv: body.cardDetails.cvv,
    }
  );

  return res.data;
}

export async function verifyPayment(paymentId: number) {
  const res = await apiClient.post<{ success: boolean }>(
    `/payments/${paymentId}/verify`
  );
  return res.data.success;
}

export async function verifyPaymentFromReturnUrl(paymentId: number, queryParams: URLSearchParams) {
  const queryString = queryParams.toString();
  const res = await apiClient.post<{ success: boolean }>(
    `/payments/${paymentId}/verify-return-url${queryString ? `?${queryString}` : ''}`
  );
  return res.data.success;
}

export async function getPaymentsByBooking(bookingId: number) {
  const res = await apiClient.get(`/payments/booking/${bookingId}`);
  return res.data;
}

export async function getPaymentById(paymentId: number) {
  const res = await apiClient.get(`/payments/${paymentId}`);
  return res.data;
}
