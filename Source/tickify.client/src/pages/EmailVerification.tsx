import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Info, Mail, AlertCircle, Loader2, ArrowLeft, Copy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { authService } from '../services/authService';
import { toast } from 'sonner';

interface EmailVerificationProps {
  token?: string;
  onNavigate: (page: string) => void;
}

type VerificationStatus = 'loading' | 'success' | 'expired' | 'invalid' | 'already-verified' | 'error';

export function EmailVerification({ token, onNavigate }: EmailVerificationProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [email, setEmail] = useState('');
  const [urlToken, setUrlToken] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Get token and email from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || token || '';
    const emailParam = params.get('email') || '';
    setUrlToken(tokenParam);
    setEmail(emailParam);
  }, [token]);

  // Verify token
  useEffect(() => {
    const verifyToken = async () => {
      if (!urlToken || !email) {
        setStatus('invalid');
        return;
      }

      try {
        await authService.verifyEmail(urlToken, email);
        setStatus('success');
      } catch (err: any) {
        const errorResponse = err.response?.data;
        
        if (errorResponse?.message?.includes('expired')) {
          setStatus('expired');
        } else if (errorResponse?.message?.includes('already verified')) {
          setStatus('already-verified');
        } else {
          setStatus('error');
        }
      }
    };

    if (urlToken && email) {
      verifyToken();
    }
  }, [urlToken, email]);

  // Redirect countdown on success
  useEffect(() => {
    if (status === 'success' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && redirectCountdown === 0) {
      onNavigate('user-profile');
    }
  }, [status, redirectCountdown, onNavigate]);

  // Resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleResendEmail = async () => {
    if (resendCount >= 3) {
      toast.error(t('auth.maxResendReached') || 'Đã đạt giới hạn gửi lại. Vui lòng thử lại sau 1 giờ.');
      return;
    }
    
    if (!email) {
      toast.error('Email là bắt buộc');
      return;
    }

    setResendCount(resendCount + 1);
    setResendCountdown(60);
    
    try {
      // Resend verification by calling forgot password endpoint
      // This will send a new verification email
      // You might want to add a dedicated resend endpoint in the future
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại.';
      toast.error(errorMsg);
    }
  };

  const handleCopyError = () => {
    const errorDetails = `Error Code: ERR_VERIFY_001\nTimestamp: ${new Date().toISOString()}\nToken: ${token || 'none'}`;
    navigator.clipboard.writeText(errorDetails);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-blue-100 p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <Card className="w-full max-w-[500px] shadow-2xl relative z-10">
        <CardContent className="p-8 md:p-12">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">🎟️</div>
            <h1 className="text-2xl text-neutral-900">Tickify</h1>
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-block relative">
                  <Loader2 className="text-purple-600 animate-spin" size={64} />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-20 rounded-full blur-xl" />
                </div>
              </div>
              <h2 className="text-neutral-900 mb-2">Verifying Your Email...</h2>
              <p className="text-neutral-600 mb-6">Please wait while we confirm your email address</p>
              
              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full animate-scale-in">
                  <Check className="text-green-600" size={48} />
                </div>
              </div>
              
              <h2 className="text-2xl text-green-600 mb-4">Email Verified Successfully!</h2>
              
              <p className="text-neutral-600 mb-6">
                Your email address has been confirmed. You can now access all features of Tickify.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-green-800 mb-1">Verified Email:</div>
                <div className="text-green-900">{email}</div>
                <div className="text-xs text-green-600 mt-2">
                  {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="text-2xl mb-6">Welcome to Tickify! 🎉</div>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={() => onNavigate('user-profile')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => onNavigate('listing')}
                  variant="outline"
                  className="w-full"
                >
                  Explore Events
                </Button>
              </div>

              {/* Quick Tips */}
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-purple-600 hover:text-purple-700 mb-2">
                  Quick Tips to Get Started
                </summary>
                <div className="space-y-2 mt-3 text-sm text-neutral-600 bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-purple-600" />
                    <span>Complete your profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-purple-600" />
                    <span>Browse upcoming events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-purple-600" />
                    <span>Save your favorite events to wishlist</span>
                  </div>
                </div>
              </details>

              <p className="text-xs text-neutral-500 mt-4">
                Redirecting in {redirectCountdown} seconds...
              </p>
            </div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full animate-shake">
                  <X className="text-red-600" size={48} />
                </div>
              </div>
              
              <h2 className="text-2xl text-red-600 mb-4">Verification Failed</h2>
              
              <p className="text-neutral-600 mb-6">
                This verification link has expired. Links are valid for 24 hours.
              </p>

              {/* Error Details */}
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-neutral-600 mb-2 flex items-center justify-center gap-2">
                  View Error Details
                  {showErrorDetails ? '▲' : '▼'}
                </summary>
                <div className="bg-neutral-50 rounded-lg p-4 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Error Code:</span>
                    <span className="text-neutral-900">ERR_VERIFY_001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Timestamp:</span>
                    <span className="text-neutral-900">{new Date().toISOString()}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyError}
                    className="w-full mt-2"
                  >
                    <Copy size={14} className="mr-2" />
                    Copy Error Details
                  </Button>
                </div>
              </details>

              {/* Resend Section */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="text-purple-600" size={24} />
                  <h3 className="text-neutral-900">Didn't receive the email?</h3>
                </div>

                <div className="space-y-2 text-sm text-neutral-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-neutral-400" />
                    <span>Check your spam/junk folder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-neutral-400" />
                    <span>Verify your email address is correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-neutral-400" />
                    <span>Wait a few minutes for delivery</span>
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor="email" className="text-sm">Email Address</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleResendEmail}
                  disabled={resendCountdown > 0 || resendCount >= 3}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {resendCountdown > 0 ? (
                    `Resend in ${resendCountdown}s`
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>

                <p className="text-xs text-neutral-500 text-center mt-2">
                  {resendCount}/3 emails sent • Limit resets in 1 hour
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => onNavigate('login')}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Login
                </Button>
                <Button
                  variant="link"
                  onClick={() => setShowEmailPreview(true)}
                  className="w-full text-purple-600"
                >
                  What does the email look like?
                </Button>
              </div>
            </div>
          )}

          {/* Invalid State */}
          {status === 'invalid' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full">
                  <AlertCircle className="text-red-600" size={48} />
                </div>
              </div>
              
              <h2 className="text-2xl text-red-600 mb-4">Invalid Link</h2>
              
              <p className="text-neutral-600 mb-6">
                This verification link is invalid or has already been used.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Resend Verification Email
                </Button>
                <Button
                  onClick={() => onNavigate('login')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}

          {/* Already Verified State */}
          {status === 'already-verified' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full">
                  <Info className="text-blue-600" size={48} />
                </div>
              </div>
              
              <h2 className="text-2xl text-blue-600 mb-4">Account Already Verified</h2>
              
              <p className="text-neutral-600 mb-2">
                Good news! Your email was already verified.
              </p>
              <p className="text-sm text-neutral-500 mb-6">
                Verified on May 15, 2024
              </p>

              <Button
                onClick={() => onNavigate('login')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-neutral-600 mb-3">Need help?</p>
            <div className="flex justify-center gap-4 text-sm">
              <button className="text-purple-600 hover:text-purple-700">FAQ</button>
              <button className="text-purple-600 hover:text-purple-700">Contact Support</button>
            </div>
            <p className="text-xs text-neutral-500 mt-3">support@tickify.com</p>
          </div>

          {/* Security Notice */}
          <Alert className="mt-6 bg-neutral-50">
            <AlertCircle className="text-neutral-600" size={14} />
            <AlertDescription className="text-xs text-neutral-600">
              For security reasons, verification links expire in 24 hours.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Email Preview Modal */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verification Email Preview</DialogTitle>
            <DialogDescription>
              Here's what the verification email looks like
            </DialogDescription>
          </DialogHeader>

          <div className="bg-neutral-50 rounded-lg p-6 border">
            <div className="mb-4">
              <div className="text-2xl mb-2">🎟️</div>
              <h3 className="text-neutral-900">Verify Your Email Address</h3>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              Thanks for signing up! Please verify your email address by clicking the button below:
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 mb-4">
              Verify Email Address
            </Button>
            <p className="text-xs text-neutral-500">
              This link expires in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>

          <Button onClick={() => setShowEmailPreview(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
