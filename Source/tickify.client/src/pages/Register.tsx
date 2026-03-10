import { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, User, Ticket, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { authService } from "../services/authService";
import { toast } from "sonner";

// Declare Google types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (notificationCallback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

interface RegisterProps {
  onNavigate: (page: string) => void;
}

export function Register({ onNavigate }: RegisterProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const hiddenGoogleButtonRef = useRef<HTMLDivElement>(null);
  const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);

  // Password requirements state
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong"
  >("weak");

  // Check password requirements
  useEffect(() => {
    const password = formData.password;
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    setRequirements({
      length: hasLength,
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      number: hasNumber,
      special: hasSpecial,
    });

    // Calculate password strength
    const metRequirements = [
      hasLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    ].filter(Boolean).length;
    if (metRequirements <= 2) {
      setPasswordStrength("weak");
    } else if (metRequirements <= 3) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  }, [formData.password]);

  // Initialize Google Sign-In
  useEffect(() => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const checkGoogleLoaded = () => {
      if (window.google && hiddenGoogleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render Google button in hidden div
        window.google.accounts.id.renderButton(hiddenGoogleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          locale: "en_US",
        });

        setIsGoogleInitialized(true);
      } else {
        // Retry after a short delay if Google script hasn't loaded yet
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, []);

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
    }
  };

  const getStrengthWidth = () => {
    switch (passwordStrength) {
      case "weak":
        return 33;
      case "medium":
        return 66;
      case "strong":
        return 100;
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength) {
      case "weak":
        return t("auth.weak");
      case "medium":
        return t("auth.medium");
      case "strong":
        return t("auth.strong");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    if (!agreeToTerms) {
      setError(t("auth.agreeToTermsRequired"));
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(true);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError("");

      // Send credential to backend
      const loginResponse = await authService.googleLogin(response.credential);

      // Redirect based on role
      const userRole = loginResponse.roles[0];
      if (userRole === "Customer") {
        onNavigate("home");
      } else if (userRole === "Organizer") {
        onNavigate("organizer-dashboard");
      } else if (userRole === "Admin") {
        onNavigate("admin-dashboard");
      } else {
        onNavigate("home");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Đăng ký Google thất bại. Vui lòng thử lại.";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoogleLogin = () => {
    if (!isGoogleInitialized || !window.google) {
      setError("Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau.");
      return;
    }

    if (hiddenGoogleButtonRef.current) {
      // Find the Google button element (usually a div with role="button")
      const googleButton = hiddenGoogleButtonRef.current.querySelector(
        'div[role="button"]'
      ) as HTMLElement;

      if (googleButton) {
        // Programmatically click the Google button
        googleButton.click();
      } else {
        // Fallback: use prompt method to show One Tap UI
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setError(
              "Không thể hiển thị cửa sổ đăng nhập Google. Vui lòng thử lại."
            );
          }
        });
      }
    } else {
      // Fallback: use prompt method
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Ticket className="text-white" size={20} />
            </div>
            <span className="text-xl text-neutral-900">Tickify</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-neutral-900 mb-2">
                {t("auth.createAccount")}
              </h1>
              <p className="text-sm text-neutral-600">
                {t("auth.registerSubtitle")}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success Alert - Email Verification Required */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-green-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-800 mb-1">
                      {t("auth.registerSuccess")}
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      {t("auth.verificationEmailSent")}{" "}
                      <strong>{formData.email}</strong>.
                      {t("auth.checkEmailInbox")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        onClick={() => onNavigate("login")}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm"
                        size="sm"
                      >
                        {t("auth.goToLogin")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSubmit}
                        className="text-green-700 border-green-300 hover:bg-green-50 text-sm"
                        size="sm"
                        disabled={isLoading}
                      >
                        {isLoading
                          ? t("auth.resending")
                          : t("auth.resendVerification")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Social Signup - Hide when success */}
            {!success && (
              <>
                <div className="space-y-3 mb-6">
                  {/* Hidden Google Button - used for programmatic click */}
                  <div ref={hiddenGoogleButtonRef} className="hidden"></div>

                  {/* Custom Google Sign-In Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={!isGoogleInitialized || isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t("auth.continueWithGoogle")}
                  </Button>
                </div>

                <div className="relative mb-6">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-3 text-xs text-neutral-500">
                      {t("auth.orRegisterWith")}
                    </span>
                  </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        size={18}
                      />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder={t("auth.fullNamePlaceholder")}
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        size={18}
                      />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        size={18}
                      />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.passwordPlaceholder")}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-600">
                            {t("auth.passwordStrength")}
                          </span>
                          <span
                            className={`capitalize font-medium ${
                              passwordStrength === "weak"
                                ? "text-red-500"
                                : passwordStrength === "medium"
                                ? "text-yellow-500"
                                : "text-green-500"
                            }`}
                          >
                            {getStrengthText()}
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${getStrengthWidth()}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Password Requirements */}
                    {formData.password && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-neutral-700">
                          {t("auth.passwordRequirements")}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            {requirements.length ? (
                              <Check className="text-green-500" size={14} />
                            ) : (
                              <X className="text-neutral-400" size={14} />
                            )}
                            <span
                              className={
                                requirements.length
                                  ? "text-green-600"
                                  : "text-neutral-500"
                              }
                            >
                              {t("auth.minLength")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {requirements.uppercase ? (
                              <Check className="text-green-500" size={14} />
                            ) : (
                              <X className="text-neutral-400" size={14} />
                            )}
                            <span
                              className={
                                requirements.uppercase
                                  ? "text-green-600"
                                  : "text-neutral-500"
                              }
                            >
                              {t("auth.uppercase")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {requirements.lowercase ? (
                              <Check className="text-green-500" size={14} />
                            ) : (
                              <X className="text-neutral-400" size={14} />
                            )}
                            <span
                              className={
                                requirements.lowercase
                                  ? "text-green-600"
                                  : "text-neutral-500"
                              }
                            >
                              {t("auth.lowercase")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {requirements.number ? (
                              <Check className="text-green-500" size={14} />
                            ) : (
                              <X className="text-neutral-400" size={14} />
                            )}
                            <span
                              className={
                                requirements.number
                                  ? "text-green-600"
                                  : "text-neutral-500"
                              }
                            >
                              {t("auth.number")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {requirements.special ? (
                              <Check className="text-green-500" size={14} />
                            ) : (
                              <X className="text-neutral-400" size={14} />
                            )}
                            <span
                              className={
                                requirements.special
                                  ? "text-green-600"
                                  : "text-neutral-500"
                              }
                            >
                              {t("auth.specialChar")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t("auth.confirmPassword")}
                    </Label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        size={18}
                      />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("auth.confirmPasswordPlaceholder")}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) =>
                          setAgreeToTerms(checked as boolean)
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-neutral-700 leading-tight cursor-pointer"
                      >
                        {t("auth.agreeToTerms")}
                      </label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="updates"
                        checked={receiveUpdates}
                        onCheckedChange={(checked) =>
                          setReceiveUpdates(checked as boolean)
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor="updates"
                        className="text-sm text-neutral-700 leading-tight cursor-pointer"
                      >
                        {t("auth.receiveUpdates")}
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? t("auth.creatingAccount")
                      : t("auth.createAccountButton")}
                  </Button>
                </form>
              </>
            )}
          </div>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-neutral-600">
              {t("auth.alreadyHaveAccount")}{" "}
              <button
                onClick={() => onNavigate("login")}
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                {t("auth.signInNow")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
