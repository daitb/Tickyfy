import { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, Ticket } from "lucide-react";
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

interface LoginProps {
  onNavigate: (page: string) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
  const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);
  const hiddenGoogleButtonRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In
  useEffect(() => {
    // Google Client ID - Replace with your actual Google OAuth Client ID
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 
      "177365327171-n3jfda9entg6u3h6mc9glsgbeob65qs9.apps.googleusercontent.com";

    // Wait for Google script to load
    const checkGoogleLoaded = () => {
      if (window.google && hiddenGoogleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render Google button in hidden div
        window.google.accounts.id.renderButton(
          hiddenGoogleButtonRef.current,
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            locale: "en_US",
          }
        );
        
        setIsGoogleInitialized(true);
      } else {
        // Retry after a short delay if Google script hasn't loaded yet
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError("");

      // Send credential to backend
      const loginResponse = await authService.googleLogin(response.credential);

      // Redirect based on role
      const userRole = loginResponse.roles[0];
      
      if (userRole === "User") {
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
        "Đăng nhập Google thất bại. Vui lòng thử lại.";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setIsEmailNotVerified(false);

    try {
      // Call backend API
      const response = await authService.login({ email, password });

      // Redirect based on role (backend returns roles array)
      const userRole = response.roles[0];

      if (userRole === "User") {
        onNavigate("home");
      } else if (userRole === "Organizer") {
        onNavigate("organizer-dashboard");
      } else if (userRole === "Admin") {
        onNavigate("admin-dashboard");
      } else {
        onNavigate("home");
      }
    } catch (err: any) {
      // Get error message from different possible locations
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Email hoặc mật khẩu không đúng";

      setError(errorMessage);
      toast.error(errorMessage);
      
      // Check if error is about email verification
      if (errorMessage.toLowerCase().includes("xác thực email") || 
          errorMessage.toLowerCase().includes("verify") ||
          errorMessage.toLowerCase().includes("verification")) {
        setIsEmailNotVerified(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!isGoogleInitialized || !window.google) {
      setError("Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau.");
      return;
    }

    if (hiddenGoogleButtonRef.current) {
      // Find the Google button element (usually a div with role="button")
      const googleButton = hiddenGoogleButtonRef.current.querySelector('div[role="button"]') as HTMLElement;
      
      if (googleButton) {
        // Programmatically click the Google button
        googleButton.click();
      } else {
        // Fallback: use prompt method to show One Tap UI
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setError("Không thể hiển thị cửa sổ đăng nhập Google. Vui lòng thử lại.");
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
              <h1 className="text-neutral-900 mb-2">{t('auth.welcomeBack')}</h1>
              <p className="text-sm text-neutral-600">
                {t('auth.loginSubtitle')}
              </p>
            </div>

            {/* Social Login */}
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
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                >
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
                {t('auth.continueWithGoogle')}
              </Button>
            </div>

            <div className="relative mb-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-xs text-neutral-500">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message - Enhanced for Email Verification */}
              {error && !isEmailNotVerified && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Email Not Verified Warning */}
              {error && isEmailNotVerified && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                        {t('auth.emailNotVerified')}
                      </h3>
                      <p className="text-sm text-yellow-700 mb-3">
                        {error}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            await authService.resendVerificationEmail(email);
                            setError(t('auth.verificationEmailResent'));
                            setIsEmailNotVerified(false);
                          } catch (err: any) {
                            setError(err.response?.data?.message || t('auth.cannotResendEmail'));
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                        disabled={isLoading || !email}
                      >
                        {isLoading ? t('auth.resending') : t('auth.resendVerificationEmail')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={18}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={18}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked: boolean) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-neutral-700 cursor-pointer"
                  >
                    {t('auth.rememberMe')}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("forgot-password")}
                  className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
            </form>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-neutral-600">
              {t('auth.dontHaveAccount')}{" "}
              <button
                onClick={() => onNavigate("register")}
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                {t('auth.registerNow')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
