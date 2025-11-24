import { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Ticket, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { authService } from '../services/authService';

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

interface RegisterProps {
  onNavigate: (page: string) => void;
}

export function Register({ onNavigate }: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Password requirements state
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

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
    const metRequirements = [hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
    if (metRequirements <= 2) {
      setPasswordStrength('weak');
    } else if (metRequirements <= 3) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [formData.password]);

  // Initialize Google Sign-In
  useEffect(() => {
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
          text: "signup_with",
          shape: "rectangular",
          locale: "en_US",
        }
      );
    }
  }, []);

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
    }
  };

  const getStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak':
        return 33;
      case 'medium':
        return 66;
      case 'strong':
        return 100;
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'Yếu';
      case 'medium':
        return 'Trung bình';
      case 'strong':
        return 'Mạnh';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (!agreeToTerms) {
      setError('Vui lòng đồng ý với điều khoản và điều kiện');
      return;
    }

    setIsLoading(true);
    
    try {
      await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0] || 
                          err.message || 
                          'Đăng ký thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError("");

      console.log("Google Sign-Up response received");

      // Send credential to backend
      const loginResponse = await authService.googleLogin(response.credential);
      
      console.log("Google signup successful:", loginResponse);

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
      console.error("Google signup error:", err);
      
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Google sign-up failed. Please try again.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    console.log(`Sign up with ${provider}`);
    // Simulate social signup
    setTimeout(() => {
      onNavigate('home');
    }, 500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => onNavigate('home')}
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
              <h1 className="text-neutral-900 mb-2">Tạo tài khoản</h1>
              <p className="text-sm text-neutral-600">
                Đăng ký để bắt đầu sử dụng dịch vụ
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...
              </div>
            )}

            {/* Social Signup */}
            <div className="space-y-3 mb-6">
              {/* Google Sign-In Button */}
              <div ref={googleButtonRef} className="w-full" />

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialSignup('facebook')}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Tiếp tục với Facebook
              </Button>
            </div>

            <div className="relative mb-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-xs text-neutral-500">
                  Hoặc đăng ký bằng
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-600">Độ mạnh mật khẩu</span>
                      <span className={`capitalize font-medium ${
                        passwordStrength === 'weak' ? 'text-red-500' :
                        passwordStrength === 'medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
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
                    <p className="text-xs font-medium text-neutral-700">Mật khẩu phải có:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {requirements.length ? (
                          <Check className="text-green-500" size={14} />
                        ) : (
                          <X className="text-neutral-400" size={14} />
                        )}
                        <span className={requirements.length ? 'text-green-600' : 'text-neutral-500'}>
                          Ít nhất 8 ký tự
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {requirements.uppercase ? (
                          <Check className="text-green-500" size={14} />
                        ) : (
                          <X className="text-neutral-400" size={14} />
                        )}
                        <span className={requirements.uppercase ? 'text-green-600' : 'text-neutral-500'}>
                          Một chữ hoa
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {requirements.lowercase ? (
                          <Check className="text-green-500" size={14} />
                        ) : (
                          <X className="text-neutral-400" size={14} />
                        )}
                        <span className={requirements.lowercase ? 'text-green-600' : 'text-neutral-500'}>
                          Một chữ thường
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {requirements.number ? (
                          <Check className="text-green-500" size={14} />
                        ) : (
                          <X className="text-neutral-400" size={14} />
                        )}
                        <span className={requirements.number ? 'text-green-600' : 'text-neutral-500'}>
                          Một số
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {requirements.special ? (
                          <Check className="text-green-500" size={14} />
                        ) : (
                          <X className="text-neutral-400" size={14} />
                        )}
                        <span className={requirements.special ? 'text-green-600' : 'text-neutral-500'}>
                          Một ký tự đặc biệt
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-neutral-700 leading-tight cursor-pointer"
                  >
                    Tôi đồng ý với điều khoản và điều kiện
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="updates"
                    checked={receiveUpdates}
                    onCheckedChange={(checked) => setReceiveUpdates(checked as boolean)}
                    className="mt-1"
                  />
                  <label
                    htmlFor="updates"
                    className="text-sm text-neutral-700 leading-tight cursor-pointer"
                  >
                    Nhận thông tin và ưu đãi qua email
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </Button>
            </form>
          </div>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-neutral-600">
              Đã có tài khoản?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
