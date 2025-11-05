import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowLeft } from "lucide-react";

interface VerifyEmailProps {
  onNavigate: (page: string) => void;
}

export function VerifyEmail({ onNavigate }: VerifyEmailProps) {
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Lấy token từ URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (!tokenFromUrl) {
      setVerificationStatus("error");
      setMessage("Token xác thực không hợp lệ hoặc đã hết hạn");
      return;
    }

    verifyEmail(tokenFromUrl);
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    try {
      // TODO: Gọi API backend để verify email
      // const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`, {
      //   method: 'POST',
      // });
      console.log("Verifying token:", verificationToken);

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock success response
      const isSuccess = true; // Thay bằng response.ok

      if (isSuccess) {
        setVerificationStatus("success");
        setMessage("Email của bạn đã được xác thực thành công!");

        // Tự động chuyển đến trang login sau 3 giây
        setTimeout(() => {
          onNavigate("login");
        }, 3000);
      } else {
        setVerificationStatus("error");
        setMessage("Token xác thực không hợp lệ hoặc đã hết hạn");
      }
    } catch (error) {
      setVerificationStatus("error");
      setMessage(
        "Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại sau."
      );
      console.error("Verification error:", error);
    }
  };

  const handleResendEmail = async () => {
    setVerificationStatus("loading");
    setMessage("");

    try {
      // TODO: Gọi API backend để gửi lại email xác thực
      // const response = await fetch('/api/auth/resend-verification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: userEmail })
      // });

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setVerificationStatus("success");
      setMessage(
        "Email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư của bạn."
      );
    } catch (error) {
      setVerificationStatus("error");
      setMessage("Không thể gửi lại email xác thực. Vui lòng thử lại sau.");
      console.error("Resend error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate("home")}
          className="mb-4 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Về trang chủ
        </Button>

        <Card className="border-neutral-200 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              {verificationStatus === "loading" && (
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
                </div>
              )}
              {verificationStatus === "success" && (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              )}
              {verificationStatus === "error" && (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              )}
            </div>

            <CardTitle className="text-2xl text-neutral-900">
              {verificationStatus === "loading" && "Đang xác thực email..."}
              {verificationStatus === "success" && "Xác thực thành công!"}
              {verificationStatus === "error" && "Xác thực thất bại"}
            </CardTitle>

            <CardDescription className="text-neutral-600">
              {verificationStatus === "loading" &&
                "Vui lòng đợi trong giây lát"}
              {verificationStatus === "success" &&
                "Tài khoản của bạn đã được kích hoạt"}
              {verificationStatus === "error" &&
                "Không thể xác thực email của bạn"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {message && (
              <Alert
                className={
                  verificationStatus === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : verificationStatus === "error"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }
              >
                <AlertDescription className="text-sm">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {verificationStatus === "success" && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-900">
                        Email đã được xác thực
                      </p>
                      <p className="text-xs text-neutral-600">
                        Bạn có thể đăng nhập và bắt đầu đặt vé cho các sự kiện
                        yêu thích
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => onNavigate("login")}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Đăng nhập ngay
                </Button>
              </div>
            )}

            {verificationStatus === "error" && (
              <div className="space-y-3">
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-900">
                        Không thể xác thực email
                      </p>
                      <p className="text-xs text-red-700">
                        Token có thể đã hết hạn hoặc không hợp lệ
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleResendEmail}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Gửi lại email xác thực
                  </Button>

                  <Button
                    onClick={() => onNavigate("login")}
                    variant="outline"
                    className="w-full"
                  >
                    Về trang đăng nhập
                  </Button>
                </div>
              </div>
            )}

            {verificationStatus === "loading" && (
              <div className="text-center py-6">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                  <p className="text-sm text-neutral-600">
                    Đang kiểm tra thông tin xác thực...
                  </p>
                </div>
              </div>
            )}

            {/* Info section */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="flex items-start gap-3 text-xs text-neutral-600">
                <Mail className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <p>
                  Nếu bạn không nhận được email xác thực, vui lòng kiểm tra thư
                  mục spam hoặc liên hệ với chúng tôi qua{" "}
                  <a
                    href="mailto:support@tickify.com"
                    className="text-teal-600 hover:underline"
                  >
                    support@tickify.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Cần hỗ trợ?{" "}
            <a
              href="mailto:support@tickify.com"
              className="text-teal-600 hover:underline font-medium"
            >
              Liên hệ với chúng tôi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
