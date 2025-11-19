import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  CheckCircle,
  Upload,
  Edit,
  Save,
  X,
  Facebook,
  Twitter,
  Instagram,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
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

interface UserProfileProps {
  onNavigate: (page: string) => void;
}

export function UserProfile({ onNavigate }: UserProfileProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('/api/placeholder/120/120');

  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+84 123 456 789',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    streetAddress: '123 Nguyen Hue Boulevard',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    postalCode: '700000',
    country: 'Vietnam',
    bio: 'Event enthusiast and music lover. Always looking for the next great concert!',
    interests: ['Music', 'Sports', 'Arts'],
    facebook: 'https://facebook.com/johndoe',
    twitter: 'https://twitter.com/johndoe',
    instagram: 'https://instagram.com/johndoe',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    console.log('Saving profile:', formData);
    setIsEditing(false);
    // Show success toast
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
  };

  const availableInterests = [
    'Music',
    'Sports',
    'Arts',
    'Food & Drink',
    'Business',
    'Technology',
    'Theater',
    'Comedy',
    'Festivals',
  ];

  const toggleInterest = (interest: string) => {
    if (formData.interests.includes(interest)) {
      handleInputChange(
        'interests',
        formData.interests.filter((i) => i !== interest)
      );
    } else {
      handleInputChange('interests', [...formData.interests, interest]);
    }
  };

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
                      className="w-full justify-start data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900"
                    >
                      <User size={16} className="mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="w-full justify-start data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900"
                    >
                      Security
                    </TabsTrigger>
                    <TabsTrigger
                      value="preferences"
                      className="w-full justify-start data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900"
                    >
                      Preferences
                    </TabsTrigger>
                    <TabsTrigger
                      value="notifications"
                      className="w-full justify-start data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900"
                    >
                      Notifications
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
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>

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
                        {!isEditing && (
                          <Badge className="ml-2 bg-green-100 text-green-700">
                            <CheckCircle size={12} className="mr-1" />
                            Verified
                          </Badge>
                        )}
                      </Label>
                      <Input id="email" value={formData.email} disabled className="bg-gray-50" />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                      <div>
                        <Label>Gender</Label>
                        <RadioGroup
                          value={formData.gender}
                          onValueChange={(v) => handleInputChange('gender', v)}
                          disabled={!isEditing}
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" disabled={!isEditing} />
                            <Label htmlFor="male">Male</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" disabled={!isEditing} />
                            <Label htmlFor="female">Female</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" disabled={!isEditing} />
                            <Label htmlFor="other">Other</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="streetAddress">Street Address</Label>
                      <Input
                        id="streetAddress"
                        value={formData.streetAddress}
                        onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(v) => handleInputChange('state', v)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ho Chi Minh">Ho Chi Minh</SelectItem>
                            <SelectItem value="Hanoi">Hanoi</SelectItem>
                            <SelectItem value="Da Nang">Da Nang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(v) => handleInputChange('country', v)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Vietnam">🇻🇳 Vietnam</SelectItem>
                            <SelectItem value="Thailand">🇹🇭 Thailand</SelectItem>
                            <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio & Interests */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Bio & Interests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        rows={4}
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                    </div>

                    <div>
                      <Label>Interests</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableInterests.map((interest) => (
                          <Badge
                            key={interest}
                            onClick={() => isEditing && toggleInterest(interest)}
                            className={`cursor-pointer transition-colors ${
                              formData.interests.includes(interest)
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${!isEditing && 'cursor-default'}`}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Links */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Social Links (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="facebook">Facebook</Label>
                      <div className="relative">
                        <Facebook
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          id="facebook"
                          value={formData.facebook}
                          onChange={(e) => handleInputChange('facebook', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="https://facebook.com/username"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="twitter">Twitter</Label>
                      <div className="relative">
                        <Twitter
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          id="twitter"
                          value={formData.twitter}
                          onChange={(e) => handleInputChange('twitter', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <div className="relative">
                        <Instagram
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          id="instagram"
                          value={formData.instagram}
                          onChange={(e) => handleInputChange('instagram', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="https://instagram.com/username"
                        />
                      </div>
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

              {/* Other tabs (Security, Preferences, Notifications) */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Security settings content would go here...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Preferences content would go here...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Notification settings content would go here...</p>
                  </CardContent>
                </Card>
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
