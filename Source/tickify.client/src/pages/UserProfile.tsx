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
      console.error('Load profile error:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin profile');
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
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)');
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
        setSuccess('Cập nhật avatar thành công');
      } catch (err: any) {
        console.error('Upload avatar error:', err);
        setError(err.response?.data?.message || 'Không thể upload avatar');
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
      setSuccess('Cập nhật profile thành công');
    } catch (err: any) {
      console.error('Save profile error:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật profile');
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
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      setError('');
      setSuccess('');
      // Call API to change password
      // await userService.changePassword(passwordData);
      setSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setError('');
      setSuccess('');
      // Call API to update preferences
      // await userService.updatePreferences(preferences);
      setSuccess('Preferences updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-purple-600 mb-4" size={48} />
          <p className="text-gray-600">Đang tải thông tin profile...</p>
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
                  <Badge className="bg-purple-100 text-purple-700">Regular User</Badge>
                </div>

                {/* Navigation Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
                  <TabsList className="flex flex-col w-full h-auto space-y-1 bg-transparent">
                    <TabsTrigger
                      value="profile"
                      className="w-full justify-start cursor-pointer data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 hover:bg-gray-100 transition-colors"
                    >
                      <User size={16} className="mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="w-full justify-start cursor-pointer data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 hover:bg-gray-100 transition-colors"
                    >
                      <Shield size={16} className="mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger
                      value="preferences"
                      className="w-full justify-start cursor-pointer data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 hover:bg-gray-100 transition-colors"
                    >
                      <Settings size={16} className="mr-2" />
                      Preferences
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
                  <h1>My Profile</h1>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCancel}>
                        <X size={16} className="mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Changes
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
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">
                        Email Address
                        {!isEditing && formData.isEmailVerified && (
                          <Badge className="ml-2 bg-green-100 text-green-700">
                            <CheckCircle size={12} className="mr-1" />
                            Verified
                          </Badge>
                        )}
                        {!isEditing && !formData.isEmailVerified && (
                          <Badge className="ml-2 bg-yellow-100 text-yellow-700">
                            Not Verified
                          </Badge>
                        )}
                      </Label>
                      <Input id="email" value={formData.email} disabled className="bg-gray-50" />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
                    <CardTitle>Account Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Ticket className="text-purple-600" size={20} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{profileStats.totalBookings}</p>
                          <p className="text-xs text-gray-600">Total Bookings</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <Calendar className="text-pink-600" size={20} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-pink-600">{profileStats.totalEventsAttended}</p>
                          <p className="text-xs text-gray-600">Events Attended</p>
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
                          <p className="text-xs text-gray-600">Member Since</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        💡 <strong>Roles:</strong> {profileStats.roles.length > 0 ? profileStats.roles.join(', ') : 'User'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Delete Account */}
                <div className="text-center pt-6 border-t">
                  <Button
                    variant="link"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete Account
                  </Button>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-0">
                <h1 className="mb-6">Security Settings</h1>

                {/* Change Password */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock size={20} className="text-purple-600" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter new password (min 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handlePasswordChange}
                      className="bg-purple-600 hover:bg-purple-700 w-full"
                      disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    >
                      <Key size={16} className="mr-2" />
                      Update Password
                    </Button>
                  </CardContent>
                </Card>

                {/* Two-Factor Authentication */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone size={20} className="text-purple-600" />
                      Two-Factor Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">Enable 2FA</p>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={twoFactorEnabled}
                          onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    {twoFactorEnabled && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✓ Two-factor authentication is enabled. You'll need to enter a code from your authenticator app when logging in.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor size={20} className="text-purple-600" />
                      Active Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Monitor className="text-green-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium">Windows PC - Chrome</p>
                            <p className="text-sm text-gray-600">Ho Chi Minh City, Vietnam • Current session</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Smartphone className="text-gray-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium">iPhone - Safari</p>
                            <p className="text-sm text-gray-600">Ho Chi Minh City, Vietnam • 2 days ago</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          Revoke
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full mt-4">
                      Sign Out All Other Sessions
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">
                <h1 className="mb-6">Preferences</h1>

                {/* Language & Region */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe size={20} className="text-purple-600" />
                      Language & Region
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
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
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Note:</strong> View your notifications in the global notifications menu (top bar bell icon 🔔) for easier access across the app.
                      </p>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
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
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-600">Receive push notifications in browser</p>
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
                        <p className="font-medium">Marketing Emails</p>
                        <p className="text-sm text-gray-600">Receive promotional and marketing content</p>
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
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="profileVisibility">Profile Visibility</Label>
                      <Select
                        value={preferences.profileVisibility}
                        onValueChange={(value) => setPreferences({ ...preferences, profileVisibility: value })}
                      >
                        <SelectTrigger id="profileVisibility">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public - Anyone can view your profile</SelectItem>
                          <SelectItem value="private">Private - Only you can view your profile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-3">
                        Control what information is visible on your public profile:
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span>Show events I'm attending</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span>Show my reviews</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span>Show my email address</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span>Show my phone number</span>
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
                  Save Preferences
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
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and all your data will
              be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={() => setShowDeleteDialog(false)}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
