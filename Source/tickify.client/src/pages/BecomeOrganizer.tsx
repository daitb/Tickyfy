import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Building2, Mail, Phone, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { organizerService } from "../services/organizerService";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import i18n from "../i18n";

interface BecomeOrganizerProps {
  onNavigate: (page: string) => void;
}

export function BecomeOrganizer({ onNavigate }: BecomeOrganizerProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    companyName: "",
    businessRegistrationNumber: "",
    taxCode: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    website: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingRequest, setPendingRequest] = useState<any | null>(null);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'companyName':
        if (!value.trim()) return t('organizer.validation.companyNameRequired', 'Tên tổ chức là bắt buộc');
        if (value.trim().length < 3) return t('organizer.validation.companyNameTooShort', 'Tên tổ chức phải có ít nhất 3 ký tự');
        return '';
      
      case 'companyPhone':
        if (!value.trim()) return t('organizer.validation.phoneRequired', 'Số điện thoại là bắt buộc');
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(value.replace(/[\s\-]/g, ''))) {
          return t('organizer.validation.phoneInvalid', 'Số điện thoại phải có 10-11 chữ số');
        }
        return '';
      
      case 'companyEmail':
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return t('organizer.validation.emailInvalid', 'Email không hợp lệ');
          }
        }
        return '';
      
      case 'website':
        if (value && value.trim()) {
          try {
            new URL(value);
          } catch {
            return t('organizer.validation.websiteInvalid', 'URL website không hợp lệ (VD: https://example.com)');
          }
        }
        return '';
      
      case 'companyAddress':
        if (!value.trim()) return t('organizer.validation.addressRequired', 'Địa chỉ là bắt buộc');
        if (value.trim().length < 10) return t('organizer.validation.addressTooShort', 'Địa chỉ phải có ít nhất 10 ký tự');
        return '';
      
      case 'taxCode':
        if (value && value.trim()) {
          const taxCodeRegex = /^[0-9]{10}(-[0-9]{3})?$/;
          if (!taxCodeRegex.test(value.trim())) {
            return t('organizer.validation.taxCodeInvalid', 'Mã số thuế không hợp lệ (VD: 0123456789 hoặc 0123456789-001)');
          }
        }
        return '';
      
      case 'businessRegistrationNumber':
        if (value && value.trim()) {
          const businessRegex = /^[0-9]{10,13}$/;
          if (!businessRegex.test(value.trim())) {
            return t('organizer.validation.businessRegInvalid', 'Số đăng ký kinh doanh phải có 10-13 chữ số');
          }
        }
        return '';
      
      case 'description':
        if (value && value.trim() && value.trim().length < 20) {
          return t('organizer.validation.descriptionTooShort', 'Mô tả phải có ít nhất 20 ký tự');
        }
        return '';
      
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        errors[key] = error;
      }
    });
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");
    setFieldErrors({});

    // Validate form before submit
    if (!validateForm()) {
      setIsSubmitting(false);
      toast.error(t('organizer.validation.formHasErrors', 'Vui lòng kiểm tra lại thông tin đã nhập'), {
        duration: 3000,
      });
      return;
    }

    try {
      // POST /api/organizers/register - Now creates OrganizerRequest instead of Organizer
      const response = await organizerService.registerOrganizer({
        companyName: formData.companyName,
        businessRegistrationNumber: formData.businessRegistrationNumber || undefined,
        taxCode: formData.taxCode || undefined,
        companyAddress: formData.companyAddress || undefined,
        companyPhone: formData.companyPhone || undefined,
        companyEmail: formData.companyEmail || undefined,
        website: formData.website || undefined,
        description: formData.description || undefined,
      });
      
      // Update pending request state
      setPendingRequest(response);
      setSubmitStatus("success");
      toast.success("Yêu cầu đã được gửi!", {
        description: "Admin sẽ xem xét và phê duyệt yêu cầu của bạn trong thời gian sớm nhất. Bạn sẽ nhận được email thông báo khi được phê duyệt.",
        duration: 3000,
      });
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        onNavigate("home");
      }, 3000);
    } catch (error: any) {
      setSubmitStatus("error");
      const errorMsg = 
        error.response?.data?.message || 
        error.message ||
        "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.";
      
      setErrorMessage(errorMsg);
      toast.error("Không thể gửi yêu cầu", {
        description: errorMsg,
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Real-time validation
    if (fieldErrors[name]) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // Validate field on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Check if user has pending request
  useEffect(() => {
    const checkPendingRequest = async () => {
      setIsCheckingRequest(true);
      try {
        const request = await organizerService.getMyOrganizerRequest();
        setPendingRequest(request);
      } catch (error) {
        console.error("Error checking pending request:", error);
        setPendingRequest(null);
      } finally {
        setIsCheckingRequest(false);
      }
    };

    checkPendingRequest();
  }, []);

  // Check if user is already authenticated
  const user = authService.getCurrentUser();
  const isOrganizer = user?.role?.toLowerCase() === "organizer";

  if (isCheckingRequest) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-600">Đang kiểm tra...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

  // Show pending request status
  if (pendingRequest) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-orange-600" />
                {t('organizer.pendingRequest', 'Yêu cầu đang chờ phê duyệt')}
              </CardTitle>
              <CardDescription>
                {t('organizer.pendingRequestDesc', 'Yêu cầu trở thành organizer của bạn đang được admin xem xét. Bạn sẽ nhận được email thông báo khi có kết quả.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-2">
                    {t('organizer.organizationName')}:
                  </p>
                  <p className="text-sm text-neutral-600">{pendingRequest.organizationName || pendingRequest.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-2">
                    {t('organizer.requestDate', 'Ngày gửi yêu cầu')}:
                  </p>
                  <p className="text-sm text-neutral-600">
                    {new Date(pendingRequest.requestedAt).toLocaleString(
                      i18n.language === 'vi' ? 'vi-VN' : 'en-US'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-2">
                    {t('organizer.status', 'Trạng thái')}:
                  </p>
                  <Badge
                    variant="outline"
                    style={
                      pendingRequest.status === "Approved"
                        ? { backgroundColor: '#d1fae5', color: '#047857', borderColor: '#a7f3d0' }
                        : pendingRequest.status === "Pending"
                        ? { backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }
                        : pendingRequest.status === "Rejected"
                        ? { backgroundColor: '#ffe4e6', color: '#be123c', borderColor: '#fecdd3' }
                        : { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }
                    }
                  >
                    {pendingRequest.status}
                  </Badge>
                </div>
                <Button onClick={() => onNavigate("home")} variant="outline" className="w-full">
                  {t('common.backToHome', 'Về trang chủ')}
                </Button>
              </div>
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
                {t('organizer.successDescription', 'Yêu cầu của bạn đã được gửi thành công! Admin sẽ xem xét và phê duyệt trong thời gian sớm nhất. Bạn sẽ nhận được thông báo qua email khi được phê duyệt.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-4">
                {t('organizer.redirecting', 'Đang chuyển hướng về trang chủ...')}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📧 Lưu ý:</strong> Hãy kiểm tra email của bạn để nhận thông báo khi yêu cầu được xử lý.
                </p>
              </div>
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
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  <Building2 className="inline w-4 h-4 mr-2" />
                  {t('organizer.organizationName')} *
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('organizer.orgNamePlaceholder', 'VD: Công ty TNHH ABC')}
                  required
                  className={fieldErrors.companyName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.companyName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.companyName}
                  </p>
                )}
              </div>

              {/* Business Registration */}
              <div className="space-y-2">
                <Label htmlFor="businessRegistrationNumber">
                  <FileText className="inline w-4 h-4 mr-2" />
                  {t('organizer.businessRegistration')}
                </Label>
                <Input
                  id="businessRegistrationNumber"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('organizer.businessRegPlaceholder', 'VD: 0123456789')}
                  className={fieldErrors.businessRegistrationNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.businessRegistrationNumber && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.businessRegistrationNumber}
                  </p>
                )}
              </div>

              {/* Tax Code */}
              <div className="space-y-2">
                <Label htmlFor="taxCode">
                  <FileText className="inline w-4 h-4 mr-2" />
                  {t('organizer.taxCode', 'Mã số thuế')}
                </Label>
                <Input
                  id="taxCode"
                  name="taxCode"
                  value={formData.taxCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="VD: 0123456789-001"
                  className={fieldErrors.taxCode ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.taxCode && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.taxCode}
                  </p>
                )}
              </div>

              {/* Company Phone */}
              <div className="space-y-2">
                <Label htmlFor="companyPhone">
                  <Phone className="inline w-4 h-4 mr-2" />
                  {t('organizer.phoneNumber')} *
                </Label>
                <Input
                  id="companyPhone"
                  name="companyPhone"
                  type="tel"
                  value={formData.companyPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('organizer.phonePlaceholder', 'VD: 0901234567')}
                  required
                  className={fieldErrors.companyPhone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.companyPhone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.companyPhone}
                  </p>
                )}
              </div>

              {/* Company Email */}
              <div className="space-y-2">
                <Label htmlFor="companyEmail">
                  <Mail className="inline w-4 h-4 mr-2" />
                  {t('organizer.email', 'Email công ty')}
                </Label>
                <Input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="contact@company.com"
                  className={fieldErrors.companyEmail ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.companyEmail && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.companyEmail}
                  </p>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">
                  {t('organizer.website', 'Website')}
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://www.company.com"
                  className={fieldErrors.website ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.website && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.website}
                  </p>
                )}
              </div>

              {/* Company Address */}
              <div className="space-y-2">
                <Label htmlFor="companyAddress">
                  {t('organizer.address', 'Địa chỉ công ty')} *
                </Label>
                <Input
                  id="companyAddress"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('organizer.addressPlaceholder', 'VD: 123 Đường ABC, Quận 1, TP.HCM')}
                  required
                  className={fieldErrors.companyAddress ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.companyAddress && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.companyAddress}
                  </p>
                )}
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
                  onBlur={handleBlur}
                  placeholder={t('organizer.descriptionPlaceholder', 'Giới thiệu về tổ chức của bạn và loại sự kiện bạn muốn tổ chức...')}
                  rows={4}
                  className={fieldErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors.description}
                  </p>
                )}
                {formData.description && (
                  <p className="text-xs text-neutral-500">
                    {formData.description.length} {t('common.characters', 'ký tự')}
                  </p>
                )}
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
