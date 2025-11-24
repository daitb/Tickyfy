import { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, Ticket } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";
import { authService } from "../services/authService";

// Declare Google types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface LoginProps {
  onNavigate: (page: string) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In
  useEffect(() => {
    // Google Client ID - Replace with your actual Google OAuth Client ID
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 
      "177365327171-n3jfda9entg6u3h6mc9glsgbeob65qs9.apps.googleusercontent.com";

    if (window.google && googleButtonRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render Google button
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: "outline",
          size: "large",
          width: googleButtonRef.current.offsetWidth,
          text: "continue_with",
          shape: "rectangular",
          locale: "en_US",
        }
      );
    }
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError("");

      console.log("Google Sign-In response received");

      // Send credential to backend
      const loginResponse = await authService.googleLogin(response.credential);
      
      console.log("Google login successful:", loginResponse);

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
      console.error("Google login error:", err);
      
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Đăng nhập Google thất bại. Vui lòng thử lại.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call backend API
      console.log("Attempting login with:", { email, password: "***" });
      const response = await authService.login({ email, password });
      console.log("Login response:", response);

      // Redirect based on role (backend returns roles array)
      const userRole = response.roles[0];
      console.log("User role:", userRole);

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
      console.error("Login error full:", err);
      console.error("Error response:", err.response);
      console.error("Error response data:", err.response?.data);

      // Get error message from different possible locations
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Invalid email or password";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Facebook login can be implemented later
    if (provider === "google") {
      // Google Sign-In is handled by the button component
      console.log("Use Google button below");
    } else if (provider === "facebook") {
      setError("Facebook login is coming soon!");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Ticket className="text-white" size={20} />
            </div>
            <span className="text-xl text-neutral-900">Tickify</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-neutral-900 mb-2">Đăng nhập</h1>
              <p className="text-sm text-neutral-600">
                Đăng nhập vào tài khoản của bạn để tiếp tục
              </p>
            </div>

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              {/* Google Sign-In Button */}
              <div ref={googleButtonRef} className="w-full"></div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin("facebook")}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="#1877F2"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </Button>
            </div>

            <div className="relative mb-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-xs text-neutral-500">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={18}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={18}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu của bạn"
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
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("forgot-password")}
                  className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-neutral-600">
              Chưa có tài khoản?{" "}
              <button
                onClick={() => onNavigate("register")}
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
