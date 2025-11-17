import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyPayment } from "../services/paymentService";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PaymentReturn() {
  const query = useQuery();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);

  useEffect(() => {
    async function run() {
      setStatus("verifying");

      // Check if this is a free booking (no payment required)
      const isFree = query.get("free") === "true";
      const bookingIdParam = query.get("bookingId");

      if (isFree && bookingIdParam) {
        // Free booking - no payment verification needed
        const parsedBookingId = parseInt(bookingIdParam, 10);
        if (!isNaN(parsedBookingId)) {
          setPaymentId(parsedBookingId);
          setStatus("success");
          setMessage("Your free booking has been confirmed!");
          setTimeout(() => navigate("/my-tickets"), 2000);
          return;
        }
      }

      // VNPay uses vnp_TxnRef as the payment id; MoMo uses orderId
      // VNPay also has vnp_ResponseCode: "00" means success
      const vnpTxnRef = query.get("vnp_TxnRef");
      const vnpResponseCode = query.get("vnp_ResponseCode");
      const orderId = query.get("orderId");
      const resultCode = query.get("resultCode"); // MoMo result code: 0 means success
      const errorCode = query.get("errorCode"); // MoMo error code: 0 means success

      // Determine payment ID
      let paymentIdParam = vnpTxnRef || query.get("paymentId");
      
      // For MoMo: orderId format is "paymentId_timestamp" (e.g., "30_20251114042356")
      if (orderId) {
        if (orderId.includes("_")) {
          // New format: extract paymentId from "paymentId_timestamp"
          const parts = orderId.split("_");
          if (parts.length > 0) {
            paymentIdParam = parts[0];
          }
        } else {
          // Old format: orderId is just paymentId
          paymentIdParam = orderId;
        }
      }

      if (!paymentIdParam) {
        setStatus("failed");
        setMessage("Payment ID not found in return parameters. Please contact support.");
        return;
      }

      const parsedPaymentId = parseInt(paymentIdParam, 10);
      if (isNaN(parsedPaymentId)) {
        setStatus("failed");
        setMessage("Invalid payment ID returned from provider.");
        return;
      }

      setPaymentId(parsedPaymentId);

      // Check response codes first
      // VNPay: vnp_ResponseCode = "00" means success
      // MoMo: errorCode = 0 OR resultCode = 0 means success
      const isProviderSuccess = 
        (vnpResponseCode === "00") || 
        (errorCode === "0") ||
        (resultCode === "0" || resultCode === "00");

      if (!isProviderSuccess) {
        setStatus("failed");
        setMessage(
          vnpResponseCode 
            ? `Payment failed. Response code: ${vnpResponseCode}`
            : resultCode
            ? `Payment failed. Result code: ${resultCode}`
            : "Payment was cancelled or failed."
        );
        return;
      }

      // Verify payment with backend
      try {
        const ok = await verifyPayment(parsedPaymentId);
        if (ok) {
          setStatus("success");
          setMessage("Payment verified successfully! Your booking is confirmed.");
          // Navigate to success page or my tickets after 2 seconds
          setTimeout(() => navigate("/my-tickets"), 2000);
        } else {
          setStatus("failed");
          setMessage("Payment verification failed. Please check your booking or contact support.");
        }
      } catch (err: any) {
        console.error("Payment verification error:", err);
        setStatus("failed");
        setMessage(
          err.response?.data?.message || 
          "Error verifying payment. Please contact support if the payment was successful."
        );
      }
    }

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto mb-4 text-teal-500 animate-spin" size={48} />
            <h1 className="text-2xl font-semibold mb-2">Verifying Payment</h1>
            <p className="text-neutral-600">Please wait while we verify your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
            <h1 className="text-2xl font-semibold mb-2 text-green-700">Payment Successful!</h1>
            {message && <p className="text-neutral-600 mb-6">{message}</p>}
            {paymentId && (
              <p className="text-sm text-neutral-500 mb-6">Payment ID: {paymentId}</p>
            )}
            <Button
              onClick={() => navigate("/my-tickets")}
              className="bg-teal-500 hover:bg-teal-600"
            >
              View My Tickets
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h1 className="text-2xl font-semibold mb-2 text-red-700">Payment Failed</h1>
            {message && <p className="text-neutral-600 mb-6">{message}</p>}
            {paymentId && (
              <p className="text-sm text-neutral-500 mb-6">Payment ID: {paymentId}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/checkout")}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate("/my-tickets")}
                className="flex-1 bg-teal-500 hover:bg-teal-600"
              >
                My Tickets
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
