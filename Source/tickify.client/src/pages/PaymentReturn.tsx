import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyPayment, getPaymentById, verifyPaymentFromReturnUrl } from "../services/paymentService";
import { CheckCircle, XCircle, Loader2, CreditCard, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

interface PaymentDetails {
  id: number;
  bookingId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
  paymentGateway?: string;
}

export default function PaymentReturn() {
  const query = useQuery();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  const verifyPaymentStatus = async (paymentId: number, isRetry = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    }
    
    setStatus("verifying");
    
    // For retries, use longer delays
    const maxRetries = 5; // Increased from 3
    const retryDelay = isRetry ? 2000 : 1000; // 2 seconds for retries, 1 second for initial
    
    try {
      let verified = false;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const ok = await verifyPayment(paymentId);
          if (ok) {
            verified = true;
            break;
          }
          
          // Wait before retrying
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          }
        } catch (err: any) {
          console.error(`Verification attempt ${attempt + 1} failed:`, err);
          // Wait before retrying on error too
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }
      
      if (verified) {
        setStatus("success");
        setMessage("Payment verified successfully! Your booking is confirmed.");
        
        // Fetch payment details to display
        try {
          const paymentData = await getPaymentById(paymentId);
          setPaymentDetails(paymentData);
        } catch (err) {
          console.error("Failed to fetch payment details:", err);
          // Continue even if payment details fetch fails
        }
        
        // Don't auto-navigate, let user see the success message and payment details
      } else {
        setStatus("failed");
        setMessage(
          "Payment verification is still pending. The payment may still be processing. Please try checking again in a moment or contact support if the issue persists."
        );
      }
    } catch (err: any) {
      console.error("Payment verification error:", err);
      setStatus("failed");
      setMessage(
        err.response?.data?.message || 
        "Error verifying payment. Please try again or contact support if the payment was successful."
      );
    }
  };

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
      // Note: MoMo may not send resultCode/errorCode in ReturnUrl, so we check if they exist first
      const hasVnPayResponse = vnpResponseCode !== null;
      const hasMomoResponse = resultCode !== null || errorCode !== null;
      
      const isProviderSuccess = 
        (vnpResponseCode === "00") || 
        (errorCode === "0") ||
        (resultCode === "0" || resultCode === "00");

      // If we have explicit error codes and they indicate failure, fail immediately
      // Otherwise, proceed to backend verification (MoMo may not send resultCode in ReturnUrl)
      if ((hasVnPayResponse || hasMomoResponse) && !isProviderSuccess) {
        setStatus("failed");
        setMessage(
          vnpResponseCode 
            ? `Payment failed. Response code: ${vnpResponseCode}`
            : resultCode
            ? `Payment failed. Result code: ${resultCode}`
            : errorCode
            ? `Payment failed. Error code: ${errorCode}`
            : "Payment was cancelled or failed."
        );
        return;
      }

      // First, try to verify from return URL parameters directly
      // This is more reliable when webhooks can't reach localhost
      if (hasVnPayResponse || hasMomoResponse) {
        try {
          const verifiedFromReturnUrl = await verifyPaymentFromReturnUrl(parsedPaymentId, query);
          if (verifiedFromReturnUrl) {
            setStatus("success");
            setMessage("Payment verified successfully! Your booking is confirmed.");
            
            // Fetch payment details to display
            try {
              const paymentData = await getPaymentById(parsedPaymentId);
              setPaymentDetails(paymentData);
            } catch (err) {
              console.error("Failed to fetch payment details:", err);
            }
            return; // Success, exit early
          }
        } catch (err) {
          console.error("Return URL verification failed, falling back to standard verification:", err);
          // Fall through to standard verification
        }
      }
      
      // Fallback to standard verification (checks database status)
      // For MoMo, if resultCode/errorCode are not present in ReturnUrl,
      // we rely on backend verification which checks the actual payment status
      // Check if we have any indication of success (even if codes are missing)
      const hasSuccessCode = isProviderSuccess && (hasVnPayResponse || hasMomoResponse);
      const hasOrderId = orderId !== null; // MoMo returns orderId even if codes are missing
      
      // If we have orderId from MoMo, it's likely a successful return (MoMo redirects on success)
      // Proceed with verification with retries
      await verifyPaymentStatus(parsedPaymentId, false);
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
            
            {paymentDetails && (
              <Card className="mb-6 bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Payment Amount</span>
                      <span className="text-lg font-semibold text-green-700">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: paymentDetails.currency || 'VND'
                        }).format(paymentDetails.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Payment Method</span>
                      <span className="text-sm font-medium text-neutral-900">
                        {paymentDetails.paymentMethod || paymentDetails.paymentGateway || 'N/A'}
                      </span>
                    </div>
                    {paymentDetails.transactionId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Transaction ID</span>
                        <span className="text-sm font-mono text-neutral-700">
                          {paymentDetails.transactionId}
                        </span>
                      </div>
                    )}
                    {paymentDetails.paidAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Paid At</span>
                        <span className="text-sm text-neutral-700">
                          {new Date(paymentDetails.paidAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Status</span>
                      <span className="text-sm font-medium text-green-700">
                        {paymentDetails.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {paymentId && !paymentDetails && (
              <p className="text-sm text-neutral-500 mb-6">Payment ID: {paymentId}</p>
            )}
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/my-tickets")}
                className="bg-teal-500 hover:bg-teal-600"
              >
                View My Tickets
              </Button>
              {paymentDetails?.bookingId && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/order/${paymentDetails.bookingId}`)}
                >
                  View Order Details
                </Button>
              )}
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h1 className="text-2xl font-semibold mb-2 text-red-700">Payment Verification</h1>
            {message && <p className="text-neutral-600 mb-6">{message}</p>}
            {paymentId && (
              <p className="text-sm text-neutral-500 mb-6">Payment ID: {paymentId}</p>
            )}
            {retryCount > 0 && (
              <p className="text-sm text-neutral-500 mb-4">
                Verification attempts: {retryCount}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => paymentId && verifyPaymentStatus(paymentId, true)}
                className="w-full bg-teal-500 hover:bg-teal-600"
              >
                Check Status Again
              </Button>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
