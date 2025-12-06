import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyPayment, getPaymentById, verifyPaymentFromReturnUrl } from "../services/paymentService";
import { CheckCircle, XCircle, Loader2, CreditCard, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
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
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "failed" | "cancelled">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const verifyPaymentStatus = async (paymentId: number, isRetry = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1);
      setIsRetrying(true);
    }
    
    setStatus("verifying");
    
    // For retries, use longer delays
    const maxRetries = 5;
    const retryDelay = isRetry ? 2000 : 1000;
    
    try {
      let verified = false;
      let lastError: any = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const ok = await verifyPayment(paymentId);
          if (ok) {
            verified = true;
            break;
          }
          
          // Wait before retrying
          if (attempt < maxRetries - 1) {
            const delay = retryDelay * (attempt + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (err: any) {
          lastError = err;
          console.error(`[PaymentReturn] Verification attempt ${attempt + 1} failed:`, err);
          // Wait before retrying on error too
          if (attempt < maxRetries - 1) {
            const delay = retryDelay * (attempt + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }
      
      setIsRetrying(false);
      
      if (verified) {
        setStatus("success");
        setMessage("Thanh toán đã được xác minh thành công! Đặt chỗ của bạn đã được xác nhận.");
        
        // Fetch payment details to display
        try {
          const paymentData = await getPaymentById(paymentId);
          setPaymentDetails(paymentData);
        } catch (err) {
          // Payment details fetch failed, but payment is verified so continue
          // Continue even if payment details fetch fails
        }
      } else {
        setStatus("failed");
        const errorMsg = lastError?.response?.data?.message || lastError?.message;
        setMessage(
          errorMsg 
            ? `Xác minh thanh toán thất bại: ${errorMsg}`
            : "Xác minh thanh toán vẫn đang chờ xử lý. Thanh toán có thể vẫn đang được xử lý. Vui lòng thử kiểm tra lại sau một lúc hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục."
        );
      }
    } catch (err: any) {
      setIsRetrying(false);
      console.error("[PaymentReturn] Payment verification error:", err);
      setStatus("failed");
      setMessage(
        err.response?.data?.message || 
        "Lỗi xác minh thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu thanh toán đã thành công."
      );
    }
  };

  useEffect(() => {
    async function run() {
      setStatus("verifying");
      
      // Log all query parameters for debugging
      const allParams: Record<string, string> = {};
      query.forEach((value, key) => {
        allParams[key] = value;
      });
      setDebugInfo(JSON.stringify(allParams, null, 2));

      // Check if this is a free booking (no payment required)
      const isFree = query.get("free") === "true";
      const bookingIdParam = query.get("bookingId");

      if (isFree && bookingIdParam) {
        // Free booking - no payment verification needed
        const parsedBookingId = parseInt(bookingIdParam, 10);
        if (!isNaN(parsedBookingId)) {
          setPaymentId(parsedBookingId);
          setStatus("success");
          setMessage("Đặt chỗ miễn phí của bạn đã được xác nhận!");
          setTimeout(() => navigate("/my-tickets"), 2000);
          return;
        }
      }

      // VNPay uses vnp_TxnRef as the payment id; MoMo uses orderId
      // VNPay also has vnp_ResponseCode: "00" means success
      const vnpTxnRef = query.get("vnp_TxnRef");
      const vnpResponseCode = query.get("vnp_ResponseCode");
      const vnpTransactionStatus = query.get("vnp_TransactionStatus"); // "00" means success
      const orderId = query.get("orderId");
      const resultCode = query.get("resultCode"); // MoMo result code: 0 means success
      const errorCode = query.get("errorCode"); // MoMo error code: 0 means success
      const messageParam = query.get("message"); // MoMo message


      // Check for cancellation (user cancelled payment)
      if (vnpResponseCode === "24" || resultCode === "1006" || errorCode === "1006") {
        setStatus("cancelled");
        setMessage("Bạn đã hủy thanh toán. Vui lòng thử lại nếu bạn muốn hoàn tất đặt chỗ.");
        return;
      }

      // Determine payment ID
      let paymentIdParam = vnpTxnRef || query.get("paymentId");
      
      // For MoMo: orderId format is "paymentId_timestamp" (e.g., "30_20251114042356")
      if (orderId) {
        if (orderId.includes("_")) {
          // New format: extract paymentId from "paymentId_timestamp"
          const parts = orderId.split("_");
          if (parts.length > 0 && parts[0]) {
            paymentIdParam = parts[0];
          }
        } else {
          // Old format: orderId is just paymentId
          paymentIdParam = orderId;
        }
      }

      if (!paymentIdParam) {
        setStatus("failed");
        setMessage("Không tìm thấy ID thanh toán trong tham số trả về. Vui lòng liên hệ hỗ trợ.");
        console.error("[PaymentReturn] Payment ID not found in query parameters");
        return;
      }

      const parsedPaymentId = parseInt(paymentIdParam, 10);
      if (isNaN(parsedPaymentId) || parsedPaymentId <= 0) {
        setStatus("failed");
        setMessage(`ID thanh toán không hợp lệ từ nhà cung cấp: ${paymentIdParam}`);
        console.error("[PaymentReturn] Invalid payment ID:", paymentIdParam);
        return;
      }

      setPaymentId(parsedPaymentId);

      // Check response codes first
      // VNPay: vnp_ResponseCode = "00" means success, vnp_TransactionStatus = "00" also means success
      // MoMo: errorCode = 0 OR resultCode = 0 means success
      // Note: MoMo may not send resultCode/errorCode in ReturnUrl, so we check if they exist first
      const hasVnPayResponse = vnpResponseCode !== null || vnpTransactionStatus !== null;
      const hasMomoResponse = resultCode !== null || errorCode !== null;
      
      const isProviderSuccess = 
        (vnpResponseCode === "00" || vnpTransactionStatus === "00") || 
        (errorCode === "0") ||
        (resultCode === "0" || resultCode === "00");

      // If we have explicit error codes and they indicate failure, fail immediately
      // Otherwise, proceed to backend verification (MoMo may not send resultCode in ReturnUrl)
      if ((hasVnPayResponse || hasMomoResponse) && !isProviderSuccess) {
        setStatus("failed");
        let errorMessage = "Thanh toán thất bại.";
        if (vnpResponseCode && vnpResponseCode !== "00") {
          errorMessage = `Thanh toán VNPay thất bại. Mã phản hồi: ${vnpResponseCode}`;
        } else if (resultCode && resultCode !== "0" && resultCode !== "00") {
          errorMessage = `Thanh toán MoMo thất bại. Mã kết quả: ${resultCode}`;
          if (messageParam) {
            errorMessage += `. Thông báo: ${messageParam}`;
          }
        } else if (errorCode && errorCode !== "0") {
          errorMessage = `Thanh toán MoMo thất bại. Mã lỗi: ${errorCode}`;
          if (messageParam) {
            errorMessage += `. Thông báo: ${messageParam}`;
          }
        }
        setMessage(errorMessage);
        console.error("[PaymentReturn] Payment failed based on provider response codes");
        return;
      }

      // First, try to verify from return URL parameters directly
      // This is more reliable when webhooks can't reach localhost
      if (hasVnPayResponse || hasMomoResponse) {
        try {
          console.log("[PaymentReturn] Attempting return URL verification...");
          const verifiedFromReturnUrl = await verifyPaymentFromReturnUrl(parsedPaymentId, query);
          if (verifiedFromReturnUrl) {
            setStatus("success");
            setMessage("Thanh toán đã được xác minh thành công! Đặt chỗ của bạn đã được xác nhận.");
            console.log("[PaymentReturn] Payment verified from return URL");
            
            // Fetch payment details to display
            try {
              const paymentData = await getPaymentById(parsedPaymentId);
              setPaymentDetails(paymentData);
            } catch (err) {
              console.error("[PaymentReturn] Failed to fetch payment details:", err);
            }
            return; // Success, exit early
          }
        } catch (err: any) {
          console.error("[PaymentReturn] Return URL verification failed, falling back to standard verification:", err);
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
            <h1 className="text-2xl font-semibold mb-2">Đang xác minh thanh toán</h1>
            <p className="text-neutral-600">
              {isRetrying 
                ? `Đang thử lại lần ${retryCount + 1}... Vui lòng đợi trong giây lát.`
                : "Vui lòng đợi trong khi chúng tôi xác minh thanh toán của bạn..."}
            </p>
            {retryCount > 0 && (
              <p className="text-sm text-neutral-500 mt-2">
                Số lần thử: {retryCount}
              </p>
            )}
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
            <h1 className="text-2xl font-semibold mb-2 text-green-700">Thanh toán thành công!</h1>
            {message && <p className="text-neutral-600 mb-6">{message}</p>}
            
            {paymentDetails && (
              <Card className="mb-6 bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Số tiền thanh toán</span>
                      <span className="text-lg font-semibold text-green-700">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: paymentDetails.currency || 'VND'
                        }).format(paymentDetails.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Phương thức thanh toán</span>
                      <span className="text-sm font-medium text-neutral-900">
                        {paymentDetails.paymentMethod || paymentDetails.paymentGateway || 'N/A'}
                      </span>
                    </div>
                    {paymentDetails.transactionId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Mã giao dịch</span>
                        <span className="text-sm font-mono text-neutral-700 break-all text-right">
                          {paymentDetails.transactionId}
                        </span>
                      </div>
                    )}
                    {paymentDetails.paidAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Thời gian thanh toán</span>
                        <span className="text-sm text-neutral-700">
                          {new Date(paymentDetails.paidAt).toLocaleString('vi-VN', {
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
                      <span className="text-sm text-neutral-600">Trạng thái</span>
                      <span className="text-sm font-medium text-green-700">
                        {paymentDetails.status === 'Completed' ? 'Đã hoàn thành' : paymentDetails.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {paymentId && !paymentDetails && (
              <p className="text-sm text-neutral-500 mb-6">Mã thanh toán: {paymentId}</p>
            )}
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/my-tickets")}
                className="bg-teal-500 hover:bg-teal-600"
              >
                Xem vé của tôi
              </Button>
              {paymentDetails?.bookingId && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/order/${paymentDetails.bookingId}`)}
                >
                  Xem chi tiết đơn hàng
                </Button>
              )}
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h1 className="text-2xl font-semibold mb-2 text-red-700">Xác minh thanh toán thất bại</h1>
            {message && <p className="text-neutral-600 mb-6">{message}</p>}
            {paymentId && (
              <p className="text-sm text-neutral-500 mb-4">Mã thanh toán: {paymentId}</p>
            )}
            {retryCount > 0 && (
              <p className="text-sm text-neutral-500 mb-4">
                Số lần thử: {retryCount}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => paymentId && verifyPaymentStatus(paymentId, true)}
                disabled={isRetrying}
                className="w-full bg-teal-500 hover:bg-teal-600"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang kiểm tra lại...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Kiểm tra lại trạng thái
                  </>
                )}
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/checkout")}
                  className="flex-1"
                >
                  Thử lại
                </Button>
                <Button
                  onClick={() => navigate("/my-tickets")}
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                >
                  Vé của tôi
                </Button>
              </div>
            </div>
          </>
        )}

        {status === "cancelled" && (
          <>
            <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
            <h1 className="text-2xl font-semibold mb-2 text-amber-700">Thanh toán đã bị hủy</h1>
            {message && <p className="text-neutral-600 mb-6">{message}</p>}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/checkout")}
                className="w-full bg-teal-500 hover:bg-teal-600"
              >
                Thử thanh toán lại
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Về trang chủ
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
