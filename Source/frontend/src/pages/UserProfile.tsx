import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Save,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Key,
  Bell,
  CreditCard,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

interface UserProfileProps {
  onNavigate: (page: string) => void;
}

interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  avatarUrl: string;
}

export function UserProfile({ onNavigate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Mock user data
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    phoneNumber: "0901234567",
    dateOfBirth: "1995-05-15",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    avatarUrl: "",
  });

  const [tempData, setTempData] = useState<ProfileData>(profileData);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setTempData((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      // TODO: Call API to update profile
      // const response = await fetch('/api/users/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(tempData)
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock success
      setProfileData(tempData);
      setSaveStatus("success");
      setIsEditing(false);

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage("Không thể cập nhật thông tin. Vui lòng thử lại sau.");
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempData(profileData);
    setIsEditing(false);
    setSaveStatus("idle");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload avatar to server
      const reader = new FileReader();
      reader.onload = () => {
        setTempData((prev) => ({
          ...prev,
          avatarUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate("home")}
          className="mb-6 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Về trang chủ
        </Button>

        {/* Success/Error Alert */}
        {saveStatus === "success" && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Cập nhật thông tin cá nhân thành công!
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === "error" && (
          <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-neutral-200 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Avatar */}
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                      <AvatarImage
                        src={tempData.avatarUrl || profileData.avatarUrl}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-teal-400 to-blue-500 text-white text-3xl">
                        {getInitials(profileData.fullName)}
                      </AvatarFallback>
                    </Avatar>

                    {isEditing && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    )}
                  </div>

                  {/* Name & Email */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-neutral-900">
                      {profileData.fullName}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {profileData.email}
                    </p>
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200">
                      Đã xác thực
                    </Badge>
                  </div>

                  <Separator />

                  {/* Stats */}
                  <div className="w-full grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-teal-600">12</p>
                      <p className="text-xs text-neutral-600">Vé đã đặt</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">5</p>
                      <p className="text-xs text-neutral-600">Sự kiện</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-neutral-200 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onNavigate("my-tickets")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Vé của tôi
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onNavigate("change-password")}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Đổi mật khẩu
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="mr-2 h-4 w-4" />
                  Thông báo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right content - Profile Details */}
          <div className="lg:col-span-2">
            <Card className="border-neutral-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-neutral-900">
                      Thông tin cá nhân
                    </CardTitle>
                    <CardDescription>
                      Quản lý thông tin tài khoản của bạn
                    </CardDescription>
                  </div>

                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal">
                      Thông tin cá nhân
                    </TabsTrigger>
                    <TabsTrigger value="security">Bảo mật</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6 mt-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullName"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4 text-teal-600" />
                        Họ và tên
                      </Label>
                      <Input
                        id="fullName"
                        value={
                          isEditing ? tempData.fullName : profileData.fullName
                        }
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        disabled={!isEditing}
                        className="border-neutral-300"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4 text-teal-600" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="border-neutral-300 bg-neutral-50"
                      />
                      <p className="text-xs text-neutral-500">
                        Email không thể thay đổi
                      </p>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4 text-teal-600" />
                        Số điện thoại
                      </Label>
                      <Input
                        id="phone"
                        value={
                          isEditing
                            ? tempData.phoneNumber
                            : profileData.phoneNumber
                        }
                        onChange={(e) =>
                          handleInputChange("phoneNumber", e.target.value)
                        }
                        disabled={!isEditing}
                        className="border-neutral-300"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-teal-600" />
                        Ngày sinh
                      </Label>
                      <Input
                        id="dob"
                        type="date"
                        value={
                          isEditing
                            ? tempData.dateOfBirth
                            : profileData.dateOfBirth
                        }
                        onChange={(e) =>
                          handleInputChange("dateOfBirth", e.target.value)
                        }
                        disabled={!isEditing}
                        className="border-neutral-300"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="address"
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4 text-teal-600" />
                        Địa chỉ
                      </Label>
                      <Input
                        id="address"
                        value={
                          isEditing ? tempData.address : profileData.address
                        }
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        disabled={!isEditing}
                        className="border-neutral-300"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Key className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900 mb-1">
                              Mật khẩu
                            </h4>
                            <p className="text-sm text-neutral-600 mb-3">
                              Thay đổi mật khẩu thường xuyên để bảo vệ tài khoản
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigate("change-password")}
                            >
                              Đổi mật khẩu
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Bell className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900 mb-1">
                              Xác thực 2 lớp
                            </h4>
                            <p className="text-sm text-neutral-600 mb-3">
                              Tăng cường bảo mật tài khoản với xác thực 2 lớp
                            </p>
                            <Button variant="outline" size="sm" disabled>
                              Đang phát triển
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
