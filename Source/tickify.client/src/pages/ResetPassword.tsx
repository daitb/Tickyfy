import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';

interface ResetPasswordProps {
  token?: string;
  onNavigate: (page: string) => void;
}

export function ResetPassword({ token, onNavigate }: ResetPasswordProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password requirements state
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real app, validate token with API
      setTokenStatus(token ? 'valid' : 'invalid');
    };
    validateToken();
  }, [token]);

  // Check password requirements
  useEffect(() => {
    const hasLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    setRequirements({
      length: hasLength,
      uppercase: hasUppercase,
      number: hasNumber,
      special: hasSpecial,
    });

    // Calculate password strength
    const metRequirements = [hasLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
    if (metRequirements <= 2) {
      setPasswordStrength('weak');
    } else if (metRequirements === 3) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [newPassword]);

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

  const handleResetPassword = async () => {
    setError('');

    // Validation
    if (!Object.values(requirements).every(Boolean)) {
      setError('Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);
    setResetSuccess(true);

    // Redirect to login after 3 seconds
    setTimeout(() => {
      onNavigate('login');
    }, 3000);
  };

  if (tokenStatus === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="mx-auto text-purple-600 animate-spin mb-4" size={48} />
              <p className="text-gray-600">Validating reset token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <XCircle className="mx-auto text-red-500 mb-4" size={48} />
              <h2 className="text-neutral-900 mb-2">Invalid or Expired Token</h2>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Button onClick={() => onNavigate('forgot-password')} className="bg-purple-600 hover:bg-purple-700">
                Request New Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
              <h2 className="text-neutral-900 mb-2">Password Reset Successful</h2>
              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <Button onClick={() => onNavigate('login')} className="bg-purple-600 hover:bg-purple-700">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="text-4xl">🎟️</div>
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Success Indicator */}
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="text-green-600" size={16} />
            <AlertDescription className="text-green-800">
              Token validated successfully. You can now reset your password.
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <XCircle className="text-red-600" size={16} />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Password Strength</span>
                  <span className={`capitalize ${getStrengthColor().replace('bg-', 'text-')}`}>
                    {passwordStrength}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${getStrengthWidth()}%` }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            {newPassword && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-700 mb-2">Password must contain:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {requirements.length ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <XCircle size={14} className="text-gray-400" />
                    )}
                    <span className={requirements.length ? 'text-green-700' : 'text-gray-600'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {requirements.uppercase ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <XCircle size={14} className="text-gray-400" />
                    )}
                    <span className={requirements.uppercase ? 'text-green-700' : 'text-gray-600'}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {requirements.number ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <XCircle size={14} className="text-gray-400" />
                    )}
                    <span className={requirements.number ? 'text-green-700' : 'text-gray-600'}>
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {requirements.special ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <XCircle size={14} className="text-gray-400" />
                    )}
                    <span className={requirements.special ? 'text-green-700' : 'text-gray-600'}>
                      One special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Reset Button */}
            <Button
              onClick={handleResetPassword}
              disabled={isLoading || !Object.values(requirements).every(Boolean) || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Button variant="link" onClick={() => onNavigate('login')} className="text-purple-600">
                <ArrowLeft size={16} className="mr-1" />
                Back to Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
