import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  CheckCircle,
  Upload,
  Edit,
  Save,
  X,
  Trash2,
  Loader2,
  Shield,
  Settings,
  Bell,
  Calendar,
  Ticket,
  Clock,
  Lock,
  Key,
  Smartphone,
  Monitor,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

interface UserProfileProps {
  onNavigate: (page: string) => void;
}

export function UserProfile({ onNavigate }: UserProfileProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('/api/placeholder/120/120');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    isEmailVerified: false,
  });

  const [profileStats, setProfileStats] = useState({
    totalBookings: 0,
    totalEventsAttended: 0,
    memberSince: '',
    roles: [] as string[],
  });

  const [originalData, setOriginalData] = useState(formData);

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    profileVisibility: 'public',
  });

  // Load user profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      const profile = await userService.getCurrentUserProfile();
      
      const profileData = {
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        isEmailVerified: profile.emailVerified || false,
      };

      setFormData(profileData);
      setOriginalData(profileData);
      
      // Load statistics
      setProfileStats({
        totalBookings: profile.totalBookings || 0,
        totalEventsAttended: profile.totalEventsAttended || 0,
        memberSince: profile.memberSince || '',
        roles: profile.roles || [],
      });
      
      if (profile.avatarUrl) {
        setAvatarPreview(profile.avatarUrl);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải thông tin profile';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('pages.userProfile.avatarSizeError'));
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError(t('pages.userProfile.avatarTypeError'));
        return;
      }

      try {
        setError('');
        setSuccess('');
        
        // Preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const avatarUrl = await userService.uploadAvatar(file);
        setAvatarPreview(avatarUrl);
        setSuccess(t('pages.userProfile.avatarUpdateSuccess'));
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || t('pages.userProfile.uploadAvatarError');
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      await userService.updateProfile({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
      });

      setOriginalData(formData);
      setIsEditing(false);
      setSuccess(t('pages.userProfile.profileUpdateSuccess'));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('pages.userProfile.profileUpdateError');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('pages.userProfile.passwordMismatch'));
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError(t('pages.userProfile.passwordMinLength'));
      return;
    }
    try {
      setIsChangingPassword(true);
      setError('');
      setSuccess('');
      
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      
      setSuccess(t('pages.userProfile.passwordChangeSuccess'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(0);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('pages.userProfile.passwordChangeError');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    return strength;
  };

  const handleNewPasswordChange = (value: string) => {
    setPasswordData({ ...passwordData, newPassword: value });
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return t('pages.userProfile.passwordWeak');
    if (passwordStrength < 50) return t('pages.userProfile.passwordMedium');
    if (passwordStrength < 75) return t('pages.userProfile.passwordGood');
    return t('pages.userProfile.passwordStrong');
  };

  const handlePreferencesUpdate = async () => {
    try {
      setError('');
      setSuccess('');
      // Call API to update preferences
      // await userService.updatePreferences(preferences);
      setSuccess(t('pages.userProfile.preferencesUpdateSuccess'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('pages.userProfile.preferencesUpdateError'));
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-purple-600 mb-4" size={48} />
          <p className="text-gray-600">{t('pages.userProfile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-80 flex-shrink-0">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                {/* Avatar Section */}
                <div className="text-center mb-6">
                  <div className="relative inline-block group">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-3xl">
                        {formData.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Upload className="text-white" size={24} />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <h3 className="text-neutral-900 mb-1">{formData.fullName}</h3>
                  <Badge className="bg-purple-100 text-purple-700">{t('pages.userProfile.regularUser')}</Badge>
                </div>

                {/* Navigation Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
                  <TabsList className="flex flex-col w-full h-auto space-y-1 bg-transparent">
                    <TabsTrigger
                      value="profile"
                      className="w-full justify-start cursor-pointer data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 hover:bg-gray-100 transition-colors"
                    >
                      <User size={16} className="mr-2" />
                      {t('pages.userProfile.profile')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="w-full justify-start cursor-pointer data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 hover:bg-gray-100 transition-colors"
                    >
                      <Shield size={16} className="mr-2" />
                      {t('pages.userProfile.security')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="preferences"
                      className="w-full justify-start cursor-pointer data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 hover:bg-gray-100 transition-colors"
                    >
                      <Settings size={16} className="mr-2" />
                      {t('pages.userProfile.preferences')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0">
                <div className="flex items-center justify-between mb-6">
                  <h1>{t('pages.userProfile.myProfile')}</h1>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Edit size={16} className="mr-2" />
                      {t('pages.userProfile.editProfile')}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCancel}>
                        <X size={16} className="mr-2" />
                        {t('pages.userProfile.cancel')}
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            {t('pages.userProfile.savingChanges')}
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            {t('pages.userProfile.saveChanges')}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
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
                    {success}
                  </div>
                )}

                {/* Personal Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{t('pages.userProfile.personalInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">{t('pages.userProfile.fullName')}</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">
                        {t('pages.userProfile.emailAddress')}
                        {!isEditing && formData.isEmailVerified && (
                          <Badge className="ml-2 bg-green-100 text-green-700">
                            <CheckCircle size={12} className="mr-1" />
                            {t('pages.userProfile.verified')}
                          </Badge>
                        )}
                        {!isEditing && !formData.isEmailVerified && (
                          <Badge className="ml-2 bg-yellow-100 text-yellow-700">
                            {t('pages.userProfile.notVerified')}
                          </Badge>
                        )}
                      </Label>
                      <Input id="email" value={formData.email} disabled className="bg-gray-50" />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">{t('pages.userProfile.phoneNumber')}</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth">{t('pages.userProfile.dateOfBirth')}</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Account Statistics */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{t('pages.userProfile.accountStatistics')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Ticket className="text-purple-600" size={20} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{profileStats.totalBookings}</p>
                          <p className="text-xs text-gray-600">{t('pages.userProfile.totalBookings')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <Calendar className="text-pink-600" size={20} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-pink-600">{profileStats.totalEventsAttended}</p>
                          <p className="text-xs text-gray-600">{t('pages.userProfile.eventsAttended')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg col-span-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-600">
                            {profileStats.memberSince ? new Date(profileStats.memberSince).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-600">{t('pages.userProfile.memberSince')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        💡 <strong>{t('pages.userProfile.roles')}:</strong> {profileStats.roles.length > 0 ? profileStats.roles.join(', ') : 'User'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-0">
                <h1 className="mb-6">{t('pages.userProfile.securitySettings')}</h1>

                {/* Error Alert */}
                {error && activeTab === 'security' && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X size={12} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-800 text-sm">{t('pages.userProfile.errorTitle')}</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success Alert */}
                {success && activeTab === 'security' && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-800 text-sm">{t('pages.userProfile.successTitle')}</p>
                      <p className="text-sm text-green-600">{success}</p>
                    </div>
                  </div>
                )}

                {/* Change Password */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock size={20} className="text-purple-600" />
                      {t('pages.userProfile.changePassword')}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      {t('pages.userProfile.passwordDescription')}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-sm font-medium">
                        {t('pages.userProfile.currentPassword')}
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder={t('pages.userProfile.currentPasswordPlaceholder')}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword" className="text-sm font-medium">
                        {t('pages.userProfile.newPassword')}
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handleNewPasswordChange(e.target.value)}
                          placeholder={t('pages.userProfile.newPasswordPlaceholder')}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {passwordData.newPassword && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{t('userProfile.passwordStrengthLabel')}</span>
                            <span className={`text-xs font-medium ${
                              passwordStrength < 25 ? 'text-red-600' :
                              passwordStrength < 50 ? 'text-orange-600' :
                              passwordStrength < 75 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5 mt-2">
                            <p className={passwordData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                              {passwordData.newPassword.length >= 8 ? '✓' : '○'} {t('pages.userProfile.passwordRequirement8Chars')}
                            </p>
                            <p className={/[A-Z]/.test(passwordData.newPassword) && /[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>
                              {/[A-Z]/.test(passwordData.newPassword) && /[a-z]/.test(passwordData.newPassword) ? '✓' : '○'} {t('userProfile.passwordRequirementUpperLower')}
                            </p>
                            <p className={/[0-9]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>
                              {/[0-9]/.test(passwordData.newPassword) ? '✓' : '○'} {t('pages.userProfile.passwordRequirementNumber')}
                            </p>
                            <p className={/[^a-zA-Z0-9]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>
                              {/[^a-zA-Z0-9]/.test(passwordData.newPassword) ? '✓' : '○'} {t('pages.userProfile.passwordRequirementSpecial')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        {t('pages.userProfile.confirmNewPassword')}
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder={t('pages.userProfile.confirmPasswordPlaceholder')}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1.5">{t('pages.userProfile.passwordMismatch')}</p>
                      )}
                      {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                        <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                          <CheckCircle size={12} /> {t('pages.userProfile.passwordMatch')}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handlePasswordChange}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"
                        disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            {t('pages.userProfile.updating')}
                          </>
                        ) : (
                          <>
                            <Key size={16} className="mr-2" />
                            {t('pages.userProfile.updatePassword')}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>💡 {t('pages.userProfile.passwordNote').split(':')[0]}:</strong> {t('pages.userProfile.passwordNote').split(':')[1]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">
                <h1 className="mb-6">{t('pages.userProfile.preferences')}</h1>

                {/* Language & Region */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe size={20} className="text-purple-600" />
                      {t('pages.userProfile.languageRegion')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="language">{t('pages.userProfile.language')}</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vi">{t('pages.userProfile.vietnamese')}</SelectItem>
                          <SelectItem value="en">{t('pages.userProfile.english')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="timezone">{t('pages.userProfile.timezone')}</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                      >
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Ho_Chi_Minh">Ho Chi Minh (GMT+7)</SelectItem>
                          <SelectItem value="Asia/Bangkok">Bangkok (GMT+7)</SelectItem>
                          <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell size={20} className="text-purple-600" />
                      {t('pages.userProfile.notificationPreferences')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <p className="text-sm text-blue-800">
                        {t('pages.userProfile.notificationNote')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="font-medium">{t('pages.userProfile.emailNotifications')}</p>
                        <p className="text-sm text-gray-600">{t('pages.userProfile.receiveEmailNotifications')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="font-medium">{t('pages.userProfile.pushNotifications')}</p>
                        <p className="text-sm text-gray-600">{t('pages.userProfile.receivePushNotifications')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.pushNotifications}
                          onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{t('pages.userProfile.marketingEmails')}</p>
                        <p className="text-sm text-gray-600">{t('pages.userProfile.receiveMarketingEmails')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketingEmails}
                          onChange={(e) => setPreferences({ ...preferences, marketingEmails: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield size={20} className="text-purple-600" />
                      {t('pages.userProfile.privacySettings')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="profileVisibility">{t('pages.userProfile.profileVisibility')}</Label>
                      <Select
                        value={preferences.profileVisibility}
                        onValueChange={(value) => setPreferences({ ...preferences, profileVisibility: value })}
                      >
                        <SelectTrigger id="profileVisibility">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">{t('pages.userProfile.profileVisibilityPublic')}</SelectItem>
                          <SelectItem value="private">{t('pages.userProfile.profileVisibilityPrivate')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-3">
                        {t('pages.userProfile.controlProfileInfo')}
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span>{t('pages.userProfile.showEventsAttending')}</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span>{t('pages.userProfile.showMyReviews')}</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span>{t('pages.userProfile.showEmailAddress')}</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span>{t('pages.userProfile.showPhoneNumber')}</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Preferences Button */}
                <Button
                  onClick={handlePreferencesUpdate}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"
                >
                  <Save size={16} className="mr-2" />
                  {t('pages.userProfile.savePreferences')}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.userProfile.deleteAccountTitle')}</DialogTitle>
            <DialogDescription>
              {t('pages.userProfile.deleteAccountDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('pages.userProfile.cancel')}
            </Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={() => setShowDeleteDialog(false)}>
              {t('pages.userProfile.deleteAccount')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
