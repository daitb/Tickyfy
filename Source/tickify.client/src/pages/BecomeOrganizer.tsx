import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Building2, Mail, Phone, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import apiClient from "../services/apiClient";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";

interface BecomeOrganizerProps {
  onNavigate: (page: string) => void;
}

export function BecomeOrganizer({ onNavigate }: BecomeOrganizerProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    organizationName: "",
    businessRegistration: "",
    phoneNumber: "",
    address: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      // Call API to submit organizer application
      await apiClient.post("/Auth/request-organizer-role", formData);
      
      setSubmitStatus("success");
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        onNavigate("home");
      }, 3000);
    } catch (error: any) {
      setSubmitStatus("error");
      setErrorMessage(
        error.response?.data?.message || 
        "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Check if user is already authenticated
  const user = authService.getCurrentUser();
  const isOrganizer = user?.role?.toLowerCase() === "organizer";

  if (isOrganizer) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600" />
                {t('organizer.alreadyOrganizer')}
              </CardTitle>
              <CardDescription>
                {t('organizer.alreadyOrganizerDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => onNavigate("organizer-dashboard")} className="w-full">
                {t('organizer.goToDashboard')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitStatus === "success") {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 />
                {t('organizer.successMessage')}
              </CardTitle>
              <CardDescription>
                {t('organizer.successDescription', 'Yêu cầu của bạn đã được gửi. Admin sẽ xem xét và phê duyệt trong thời gian sớm nhất. Bạn sẽ nhận được thông báo qua email khi được phê duyệt.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                {t('organizer.redirecting', 'Đang chuyển hướng về trang chủ...')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {t('organizer.becomeOrganizer')}
          </h1>
          <p className="text-neutral-600">
            {t('organizer.description')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('organizer.title')}</CardTitle>
            <CardDescription>
              {t('organizer.formDescription', 'Vui lòng cung cấp thông tin chính xác về tổ chức của bạn')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="organizationName">
                  <Building2 className="inline w-4 h-4 mr-2" />
                  {t('organizer.organizationName')} *
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder={t('organizer.orgNamePlaceholder', 'VD: Công ty TNHH ABC')}
                  required
                />
              </div>

              {/* Business Registration */}
              <div className="space-y-2">
                <Label htmlFor="businessRegistration">
                  <FileText className="inline w-4 h-4 mr-2" />
                  {t('organizer.businessRegistration')} *
                </Label>
                <Input
                  id="businessRegistration"
                  name="businessRegistration"
                  value={formData.businessRegistration}
                  onChange={handleChange}
                  placeholder={t('organizer.businessRegPlaceholder', 'VD: 0123456789')}
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  <Phone className="inline w-4 h-4 mr-2" />
                  {t('organizer.phoneNumber')} *
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder={t('organizer.phonePlaceholder', 'VD: 0901234567')}
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  <Mail className="inline w-4 h-4 mr-2" />
                  {t('organizer.address')} *
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('organizer.addressPlaceholder', 'VD: 123 Đường ABC, Quận 1, TP.HCM')}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('organizer.additionalInfo')}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('organizer.descriptionPlaceholder', 'Giới thiệu về tổ chức của bạn và loại sự kiện bạn muốn tổ chức...')}
                  rows={4}
                />
              </div>

              {/* Error Message */}
              {submitStatus === "error" && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-red-800">{t('common.error')}</p>
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate("home")}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('organizer.submitting') : t('organizer.submit')}
                </Button>
              </div>

              <p className="text-xs text-neutral-500 text-center">
                {t('organizer.requiredNote', '* Thông tin bắt buộc. Yêu cầu sẽ được xem xét trong vòng 24-48 giờ.')}
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{t('organizer.benefit1Title')}</h3>
              <p className="text-sm text-neutral-600">
                {t('organizer.benefit1Desc')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{t('organizer.benefit2Title')}</h3>
              <p className="text-sm text-neutral-600">
                {t('organizer.benefit2Desc')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{t('organizer.benefit3Title')}</h3>
              <p className="text-sm text-neutral-600">
                {t('organizer.benefit3Desc')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
