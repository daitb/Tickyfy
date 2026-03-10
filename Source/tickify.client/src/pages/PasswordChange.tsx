import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { authService } from '../services/authService';
import { toast } from 'sonner';

interface PasswordChangeProps {
  onNavigate: (page: string) => void;
}

export function PasswordChange({ onNavigate }: PasswordChangeProps) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [logoutOtherDevices, setLogoutOtherDevices] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    notSimilar: false,
    notCommon: false,
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const hasLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const notSimilar = newPassword !== currentPassword;
    
    // Simple common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    const notCommon = !commonPasswords.some(common => newPassword.toLowerCase().includes(common));

    setRequirements({
      length: hasLength,
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      number: hasNumber,
      special: hasSpecial,
      notSimilar,
      notCommon,
    });

    // Calculate strength (0-100)
    const metRequirements = [hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, notSimilar, notCommon].filter(Boolean).length;
    setPasswordStrength((metRequirements / 7) * 100);
  }, [newPassword, currentPassword]);

  const getStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 70) return 'Good';
    return 'Strong';
  };

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const handleSubmit = async () => {
    setCurrentPasswordError('');

    // Validate current password
    if (!currentPassword) {
      setCurrentPasswordError(t('auth.currentPasswordRequired') || 'Current password is required');
      return;
    }

    // Validate new password
    if (!Object.values(requirements).every(Boolean)) {
      setCurrentPasswordError(t('auth.passwordRequirementsError') || 'Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setCurrentPasswordError(t('auth.passwordMismatch') || 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setShowSuccess(true);

      // Optionally redirect after success
      setTimeout(() => {
        onNavigate('user-profile');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0] || 
                          err.message;
      toast.error(errorMessage || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
      
      if (errorMessage?.includes('incorrect') || errorMessage?.includes('wrong')) {
        setCurrentPasswordError(t('auth.incorrectPassword') || 'Incorrect password');
        setAttempts(attempts + 1);
      } else {
        setCurrentPasswordError(errorMessage || t('auth.changePasswordError') || 'Failed to change password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    currentPassword &&
    Object.values(requirements).every(Boolean) &&
    newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
          <button onClick={() => onNavigate('user-profile')} className="hover:text-neutral-900">
            Dashboard
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('user-profile')} className="hover:text-neutral-900">
            Settings
          </button>
          <span>/</span>
          <span className="text-neutral-900">Security</span>
          <span>/</span>
          <span className="text-neutral-900">Change Password</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="mb-2">Change Password</h1>
          <p className="text-neutral-600">Keep your account secure with a strong password</p>
          <p className="text-sm text-neutral-500 mt-1">Last changed: 30 days ago</p>
        </div>

        {/* Security Alert */}
        {attempts >= 2 && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertTriangle className="text-red-600" size={16} />
            <AlertDescription className="text-red-800">
              Multiple incorrect password attempts. 
              <button className="underline ml-1" onClick={() => onNavigate('forgot-password')}>
                Reset password via email
              </button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="text-purple-600" size={24} />
                  </div>
                  <CardTitle>Update Your Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="currentPassword">
                      Current Password <span className="text-red-500">*</span>
                    </Label>
                    <button
                      onClick={() => onNavigate('forgot-password')}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setCurrentPasswordError('');
                      }}
                      placeholder="Enter your current password"
                      className={`pr-10 ${currentPasswordError ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {currentPasswordError && (
                    <p className="text-xs text-red-500 mt-1">{currentPasswordError}</p>
                  )}
                  {attempts > 0 && (
                    <p className="text-xs text-neutral-500 mt-1">Attempts: {attempts}/3</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-2">
                    We'll never ask for your password via email
                  </p>
                </div>

                {/* New Password */}
                <div>
                  <Label htmlFor="newPassword">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {newPassword && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-600">Password Strength</span>
                        <span className={getStrengthColor().replace('bg-', 'text-')}>
                          {getStrengthLabel()}
                        </span>
                      </div>
                      <Progress value={passwordStrength} className="h-2" />
                    </div>
                  )}

                  {/* Requirements Checklist */}
                  {newPassword && (
                    <div className="mt-4 space-y-2 p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-700 mb-2">Password must contain:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          {requirements.length ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <X size={14} className="text-red-500" />
                          )}
                          <span className={requirements.length ? 'text-green-700' : 'text-neutral-600'}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {requirements.uppercase ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <X size={14} className="text-red-500" />
                          )}
                          <span className={requirements.uppercase ? 'text-green-700' : 'text-neutral-600'}>
                            One uppercase (A-Z)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {requirements.lowercase ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <X size={14} className="text-red-500" />
                          )}
                          <span className={requirements.lowercase ? 'text-green-700' : 'text-neutral-600'}>
                            One lowercase (a-z)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {requirements.number ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <X size={14} className="text-red-500" />
                          )}
                          <span className={requirements.number ? 'text-green-700' : 'text-neutral-600'}>
                            One number (0-9)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {requirements.special ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <X size={14} className="text-red-500" />
                          )}
                          <span className={requirements.special ? 'text-green-700' : 'text-neutral-600'}>
                            One special (!@#$%^&*)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {requirements.notSimilar ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <X size={14} className="text-red-500" />
                          )}
                          <span className={requirements.notSimilar ? 'text-green-700' : 'text-neutral-600'}>
                            Different from current
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm col-span-2">
                          {requirements.notCommon ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <X size={14} className="text-red-500" />
                          )}
                          <span className={requirements.notCommon ? 'text-green-700' : 'text-neutral-600'}>
                            Not a common password
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <X size={12} /> Passwords don't match
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check size={12} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Password Suggestions */}
                <details open={showSuggestions} onToggle={(e: any) => setShowSuggestions(e.target.open)}>
                  <summary className="cursor-pointer text-sm text-purple-600 hover:text-purple-700 flex items-center gap-2">
                    Need help creating a strong password?
                    {showSuggestions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </summary>
                  <div className="mt-3 p-4 bg-purple-50 rounded-lg space-y-3">
                    <div className="space-y-2 text-sm text-neutral-700">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-purple-600" />
                        <span>Mix uppercase and lowercase letters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-purple-600" />
                        <span>Include numbers and symbols</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-purple-600" />
                        <span>Avoid personal information</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-purple-600" />
                        <span>Use unique password (not reused)</span>
                      </div>
                    </div>
                    <Button
                      onClick={generatePassword}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Generate Strong Password
                    </Button>
                  </div>
                </details>

                {/* Security Options */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm text-neutral-900">Security Options</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="logout" className="cursor-pointer">
                        Log out of all other devices
                      </Label>
                      <p className="text-xs text-neutral-500 mt-1">
                        This will end sessions on other browsers/devices
                      </p>
                    </div>
                    <Switch
                      id="logout"
                      checked={logoutOtherDevices}
                      onCheckedChange={setLogoutOtherDevices}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="email" className="cursor-pointer">
                        Send me an email confirmation
                      </Label>
                      <p className="text-xs text-neutral-500 mt-1">
                        You'll receive an email when password is changed
                      </p>
                    </div>
                    <Switch
                      id="email"
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock size={16} className="mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => onNavigate('user-profile')}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Password Security Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm text-neutral-900 mb-1">Use Unique Passwords</h4>
                    <p className="text-xs text-neutral-600">Don't reuse passwords across sites</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RefreshCw size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm text-neutral-900 mb-1">Update Regularly</h4>
                    <p className="text-xs text-neutral-600">Change your password every 90 days</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm text-neutral-900 mb-1">Enable 2FA</h4>
                    <p className="text-xs text-neutral-600">Add an extra layer of protection</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm text-neutral-900 mb-1">Avoid Common Passwords</h4>
                    <p className="text-xs text-neutral-600">Don't use 'password123' or birthdays</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2FA Prompt */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Shield className="text-white" size={24} />
                </div>
                <h3 className="text-neutral-900 mb-2">Extra Layer of Security</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Enable 2FA for added protection
                </p>
                <Button variant="outline" className="w-full border-purple-600 text-purple-600">
                  Set Up 2FA
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="text-green-600" size={32} />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Password Changed Successfully</DialogTitle>
            <DialogDescription className="text-center">
              Your password has been updated
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-neutral-600">Changed on:</span>
              <span className="text-neutral-900">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-neutral-600">Changed from:</span>
              <span className="text-neutral-900">192.168.1.1</span>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={() => {
                setShowSuccess(false);
                onNavigate('user-profile');
              }}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Done
            </Button>
            <Button variant="link" className="text-purple-600">
              Enable 2FA Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
