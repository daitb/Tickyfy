import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Info,
} from "lucide-react";
import { Progress } from "../components/ui/progress";

interface ChangePasswordProps {
  onNavigate: (page: string) => void;
}

export function ChangePassword({ onNavigate }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Password strength calculation
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const getStrengthText = (strength: number): string => {
    if (strength < 40) return "Yếu";
    if (strength < 70) return "Trung bình";
    return "Mạnh";
  };

  // Validation checks
  const validationChecks = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[^a-zA-Z0-9]/.test(newPassword),
    passwordsMatch: newPassword === confirmPassword && confirmPassword !== "",
  };

  const isFormValid =
    currentPassword !== "" &&
    newPassword !== "" &&
    confirmPassword !== "" &&
    validationChecks.minLength &&
    validationChecks.hasUpperCase &&
    validationChecks.hasLowerCase &&
    validationChecks.hasNumber &&
    validationChecks.hasSpecialChar &&
    validationChecks.passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      // TODO: Call API to change password
      // const response = await fetch('/api/auth/change-password', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     currentPassword,
      //     newPassword
      //   })
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock response
      const isSuccess = true; // Replace with actual response check

      if (isSuccess) {
        setSubmitStatus("success");

        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Redirect to profile after 2 seconds
        setTimeout(() => {
          onNavigate("user-profile");
        }, 2000);
      } else {
        setSubmitStatus("error");
        setErrorMessage("Mật khẩu hiện tại không chính xác");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại sau.");
      console.error("Change password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ValidationItem = ({
    isValid,
    text,
  }: {
    isValid: boolean;
    text: string;
  }) => (
    <div
      className={`flex items-center gap-2 text-sm ${
        isValid ? "text-green-600" : "text-neutral-400"
      }`}
    >
      {isValid ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate("user-profile")}
          className="mb-6 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <Card className="border-neutral-200 shadow-lg">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-neutral-900">
                  Đổi mật khẩu
                </CardTitle>
                <CardDescription>
                  Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                </CardDescription>
              </div>
            </div>

            {/* Security tip */}
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Mật khẩu mạnh giúp bảo vệ tài khoản của bạn khỏi truy cập trái
                phép
              </AlertDescription>
            </Alert>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success/Error Alert */}
              {submitStatus === "success" && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Đổi mật khẩu thành công! Đang chuyển hướng...
                  </AlertDescription>
                </Alert>
              )}

              {submitStatus === "error" && (
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="pr-10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="pr-10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">
                        Độ mạnh mật khẩu:
                      </span>
                      <span
                        className={`font-medium ${
                          passwordStrength < 40
                            ? "text-red-600"
                            : passwordStrength < 70
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <Progress value={passwordStrength} className="h-2" />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="pr-10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {newPassword && (
                <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Info className="h-4 w-4" />
                    Yêu cầu mật khẩu:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <ValidationItem
                      isValid={validationChecks.minLength}
                      text="Ít nhất 8 ký tự"
                    />
                    <ValidationItem
                      isValid={validationChecks.hasUpperCase}
                      text="Có chữ hoa (A-Z)"
                    />
                    <ValidationItem
                      isValid={validationChecks.hasLowerCase}
                      text="Có chữ thường (a-z)"
                    />
                    <ValidationItem
                      isValid={validationChecks.hasNumber}
                      text="Có số (0-9)"
                    />
                    <ValidationItem
                      isValid={validationChecks.hasSpecialChar}
                      text="Có ký tự đặc biệt (!@#$%)"
                    />
                    {confirmPassword && (
                      <ValidationItem
                        isValid={validationChecks.passwordsMatch}
                        text="Mật khẩu khớp nhau"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate("user-profile")}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Đổi mật khẩu
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Additional Tips */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-900">
                  💡 Mẹo tạo mật khẩu mạnh:
                </h4>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">•</span>
                    <span>Sử dụng ít nhất 12 ký tự</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">•</span>
                    <span>
                      Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">•</span>
                    <span>Tránh sử dụng thông tin cá nhân dễ đoán</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">•</span>
                    <span>
                      Không sử dụng lại mật khẩu từ các tài khoản khác
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
