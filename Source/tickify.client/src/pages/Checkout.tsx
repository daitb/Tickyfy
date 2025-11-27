import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle, ShoppingBag, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ProgressSteps } from "../components/ProgressSteps";
import { FeeBreakdown } from "../components/FeeBreakdown";
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "../components/PaymentMethodSelector";
import { Separator } from "../components/ui/separator";
import { eventService } from "../services/eventService";
import type { Order } from "../types";
import { bookingService } from "../services/bookingService";
import { authService } from "../services/authService";
import { createPaymentIntent } from "../services/paymentService";
import {
  validateEmail,
  validatePhone,
  validateName,
  validateMomoPhone,
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  validateCardholderName,
  formatPhoneNumber,
} from "../utils/validation";
import { useBooking } from "../contexts/BookingContext";
import { toast } from "sonner";

interface CheckoutProps {
  onNavigate: (page: string) => void;
  onCompleteOrder?: (order: Order) => void;
}

export function Checkout({
  onNavigate,
  onCompleteOrder,
}: CheckoutProps) {
  const { t } = useTranslation();
  const { bookingState, setBookingResult } = useBooking();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    name?: string;
    phone?: string;
  }>({});
  const [touchedFields, setTouchedFields] = useState<{
    email: boolean;
    name: boolean;
    phone: boolean;
  }>({
    email: false,
    name: false,
    phone: false,
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [eventDetails, setEventDetails] = useState<any>(null);
  const steps = [
    { number: 1, label: t('booking.checkout.step1') },
    { number: 2, label: t('booking.checkout.step2') },
    { number: 3, label: t('booking.checkout.step3') },
  ];

  // Fetch event details for display
  useEffect(() => {
    if (bookingState.eventId) {
      eventService
        .getEventById(bookingState.eventId)
        .then((ev) => setEventDetails(ev))
        .catch((err) => {
          console.error('Failed to fetch event details:', err);
        });
    }
  }, [bookingState.eventId]);

  // Check if we have required booking data
  if (!bookingState.eventId || !bookingState.ticketTypeId || bookingState.selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="mx-auto mb-4 text-neutral-400" size={48} />
          <h2 className="mb-2">No Booking Selected</h2>
          <p className="text-neutral-600 mb-6">
            Please select an event and seats before proceeding to checkout.
          </p>
          <Button
            onClick={() => onNavigate("home")}
            className="bg-teal-500 hover:bg-teal-600"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = bookingState.subtotal;
  const serviceFee = bookingState.serviceFee;
  const total = bookingState.total;

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Validate on change if field has been touched
    if (touchedFields[field as keyof typeof touchedFields]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouchedFields({ ...touchedFields, [field]: true });
    validateField(field, formData[field as keyof typeof formData]);
  };

  const validateField = (field: string, value: string) => {
    let validationResult: { isValid: boolean; error?: string } = { isValid: true };

    switch (field) {
      case "email":
        validationResult = validateEmail(value);
        break;
      case "name":
        validationResult = validateName(value);
        break;
      case "phone":
        validationResult = validatePhone(value);
        break;
    }

    if (!validationResult.isValid) {
      setFormErrors({ ...formErrors, [field]: validationResult.error });
    } else {
      const newErrors = { ...formErrors };
      delete newErrors[field as keyof typeof formErrors];
      setFormErrors(newErrors);
    }
  };

  const validateStep1 = (): boolean => {
    const emailValidation = validateEmail(formData.email);
    const nameValidation = validateName(formData.name);
    const phoneValidation = validatePhone(formData.phone);

    const errors: typeof formErrors = {};
    if (!emailValidation.isValid) errors.email = emailValidation.error;
    if (!nameValidation.isValid) errors.name = nameValidation.error;
    if (!phoneValidation.isValid) errors.phone = phoneValidation.error;

    setFormErrors(errors);
    setTouchedFields({ email: true, name: true, phone: true });

    return emailValidation.isValid && nameValidation.isValid && phoneValidation.isValid;
  };

  const handlePaymentMethodChange = (method: PaymentMethod, details?: any) => {
    setPaymentMethod(method);
    setPaymentDetails(details);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1 before proceeding
      if (!validateStep1()) {
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // Validate step 1 (contact information)
      if (!validateStep1()) {
        setCurrentStep(1);
        setIsProcessing(false);
        return;
      }

      // Validate step 2 (payment method)
      if (paymentMethod === "momo") {
        const momoValidation = validateMomoPhone(paymentDetails?.phone || "");
        if (!momoValidation.isValid) {
          setError(`Thông tin thanh toán không hợp lệ: ${momoValidation.error}`);
          setCurrentStep(2);
          setIsProcessing(false);
          return;
        }
      } else if (paymentMethod === "credit-card") {
        const cardNumberValidation = validateCardNumber(paymentDetails?.number || "");
        const cardNameValidation = validateCardholderName(paymentDetails?.name || "");
        const cardExpiryValidation = validateCardExpiry(paymentDetails?.expiry || "");
        const cardCvvValidation = validateCVV(paymentDetails?.cvv || "");

        if (!cardNumberValidation.isValid) {
          setError(`Thông tin thẻ không hợp lệ: ${cardNumberValidation.error}`);
          setCurrentStep(2);
          setIsProcessing(false);
          return;
        }
        if (!cardNameValidation.isValid) {
          setError(`Thông tin thẻ không hợp lệ: ${cardNameValidation.error}`);
          setCurrentStep(2);
          setIsProcessing(false);
          return;
        }
        if (!cardExpiryValidation.isValid) {
          setError(`Thông tin thẻ không hợp lệ: ${cardExpiryValidation.error}`);
          setCurrentStep(2);
          setIsProcessing(false);
          return;
        }
        if (!cardCvvValidation.isValid) {
          setError(`Thông tin thẻ không hợp lệ: ${cardCvvValidation.error}`);
          setCurrentStep(2);
          setIsProcessing(false);
          return;
        }
      }

      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        setError('Please login to complete your booking');
        toast.error('Authentication required');
        onNavigate("login");
        setIsProcessing(false);
        return;
      }

      // Validate booking state
      if (!bookingState.eventId || !bookingState.ticketTypeId) {
        setError('Invalid booking data');
        setIsProcessing(false);
        return;
      }

      // Validate that seats are selected (required for seat-based events)
      if (!bookingState.selectedSeats || bookingState.selectedSeats.length === 0) {
        setError('Please select at least one seat before proceeding to checkout');
        toast.error('No seats selected. Please go back and select your seats.');
        setIsProcessing(false);
        return;
      }

      // Validate quantity matches selected seats
      if (bookingState.quantity !== bookingState.selectedSeats.length) {
        setError('Quantity mismatch. Please refresh and try again.');
        setIsProcessing(false);
        return;
      }

      // Prepare seat IDs
      const seatIds = bookingState.selectedSeats.map((seat) => seat.id);

      // Create booking via API
      const bookingConfirmation = await bookingService.createBooking({
        eventId: bookingState.eventId,
        ticketTypeId: bookingState.ticketTypeId,
        quantity: bookingState.quantity,
        seatIds: seatIds.length > 0 ? seatIds : undefined,
        promoCode: bookingState.promoCode,
      });

      console.log("Booking created:", bookingConfirmation);

      // Store booking result in context
      setBookingResult(bookingConfirmation.bookingId, bookingConfirmation.bookingNumber);

      // Show success message
      toast.success('Booking created successfully!');

      // Now create payment intent for the booking
      const paymentProviderMap: { [key in PaymentMethod]: "momo" | "vnpay" } = {
        momo: "momo",
        vnpay: "vnpay",
        "credit-card": "vnpay", // fallback to VNPay for credit cards
      };

      const provider = paymentProviderMap[paymentMethod];
      
      try {
        const paymentIntent = await createPaymentIntent({
          bookingId: bookingConfirmation.bookingId,
          provider: provider,
        });

        console.log("Payment intent created:", paymentIntent);

        // Redirect to payment provider
        if (paymentIntent.redirectUrl) {
          window.location.href = paymentIntent.redirectUrl;
        } else {
          setError("No payment redirect URL received from provider");
          toast.error('Payment initialization failed');
        }
      } catch (paymentErr: any) {
        console.error("Payment intent creation error:", paymentErr);
        setError(
          paymentErr.response?.data?.message ||
            'Failed to initialize payment'
        );
        toast.error('Payment initialization failed');
      }
    } catch (err: any) {
      console.error("Booking creation error:", err);
      const errorMessage = err.response?.data?.message || 'Failed to create booking';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      // Check if all fields are filled and valid
      const emailValid = validateEmail(formData.email).isValid;
      const nameValid = validateName(formData.name).isValid;
      const phoneValid = validatePhone(formData.phone).isValid;
      return emailValid && nameValid && phoneValid;
    }
    if (currentStep === 2) {
      if (paymentMethod === "momo") {
        if (!paymentDetails?.phone) return false;
        return validateMomoPhone(paymentDetails.phone).isValid;
      }
      if (paymentMethod === "vnpay") {
        return true; // VNPay doesn't require additional details
      }
      if (paymentMethod === "credit-card") {
        if (!paymentDetails?.number || !paymentDetails?.name || !paymentDetails?.expiry || !paymentDetails?.cvv) {
          return false;
        }
        return (
          validateCardNumber(paymentDetails.number).isValid &&
          validateCardholderName(paymentDetails.name).isValid &&
          validateCardExpiry(paymentDetails.expiry).isValid &&
          validateCVV(paymentDetails.cvv).isValid
        );
      }
    }
    return true;
  };

  const getPaymentMethodDisplay = () => {
    if (paymentMethod === "momo") return t('booking.checkout.momoWallet');
    if (paymentMethod === "vnpay") return t('booking.checkout.vnpayGateway');
    if (paymentMethod === "credit-card")
      return `Card ending in ${paymentDetails?.number?.slice(-4) || "****"}`;
    return t('booking.checkout.notSelected');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">{t('booking.checkout.title')}</h1>
          <p className="text-neutral-600">
            {t('booking.checkout.subtitle')}
          </p>
        </div>

        <ProgressSteps steps={steps} currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-6">{t('booking.checkout.contactInformation')}</h3>
                    <p className="text-neutral-600 mb-6">
                      {t('booking.checkout.contactMessage')}
                    </p>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">{t('booking.checkout.emailAddress')} *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t('booking.checkout.emailPlaceholder')}
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          onBlur={() => handleBlur("email")}
                          className={`mt-2 ${
                            touchedFields.email && formErrors.email
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : touchedFields.email && !formErrors.email
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                              : ""
                          }`}
                        />
                        {touchedFields.email && formErrors.email && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                            <AlertCircle size={14} />
                            <span>{formErrors.email}</span>
                          </div>
                        )}
                        {touchedFields.email && !formErrors.email && formData.email && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                            <CheckCircle size={14} />
                            <span>Email hợp lệ</span>
                          </div>
                        )}
                        {!touchedFields.email && (
                          <p className="text-xs text-neutral-500 mt-2">
                            {t('booking.checkout.emailNote')}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="name">{t('booking.checkout.fullName')} *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder={t('booking.checkout.fullNamePlaceholder')}
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          onBlur={() => handleBlur("name")}
                          className={`mt-2 ${
                            touchedFields.name && formErrors.name
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : touchedFields.name && !formErrors.name
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                              : ""
                          }`}
                        />
                        {touchedFields.name && formErrors.name && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                            <AlertCircle size={14} />
                            <span>{formErrors.name}</span>
                          </div>
                        )}
                        {touchedFields.name && !formErrors.name && formData.name && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                            <CheckCircle size={14} />
                            <span>Họ tên hợp lệ</span>
                          </div>
                        )}
                        {!touchedFields.name && (
                          <p className="text-xs text-neutral-500 mt-2">
                            {t('booking.checkout.fullNameNote')}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">{t('booking.checkout.phoneNumber')} *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={t('booking.checkout.phonePlaceholder')}
                          value={formData.phone}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            handleInputChange("phone", formatted);
                          }}
                          onBlur={() => handleBlur("phone")}
                          className={`mt-2 ${
                            touchedFields.phone && formErrors.phone
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : touchedFields.phone && !formErrors.phone
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                              : ""
                          }`}
                        />
                        {touchedFields.phone && formErrors.phone && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                            <AlertCircle size={14} />
                            <span>{formErrors.phone}</span>
                          </div>
                        )}
                        {touchedFields.phone && !formErrors.phone && formData.phone && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                            <CheckCircle size={14} />
                            <span>Số điện thoại hợp lệ</span>
                          </div>
                        )}
                        {!touchedFields.phone && (
                          <p className="text-xs text-neutral-500 mt-2">
                            {t('booking.checkout.phoneNote')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle
                        className="text-teal-600 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <div className="text-sm text-teal-700">
                        <p className="mb-1">{t('booking.checkout.secureInfo')}</p>
                        <p className="text-xs">
                          {t('booking.checkout.secureInfoNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <PaymentMethodSelector
                    onPaymentMethodChange={handlePaymentMethodChange}
                    selectedMethod={paymentMethod}
                  />

                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <Lock
                        className="text-teal-600 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <div className="text-sm text-teal-700">
                        <p className="mb-1">{t('booking.checkout.securePayment')}</p>
                        <p className="text-xs">
                          {t('booking.checkout.securePaymentNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-6">{t('booking.checkout.reviewOrder')}</h3>
                    <p className="text-neutral-600 mb-6">
                      {t('booking.checkout.reviewMessage')}
                    </p>

                    <div className="space-y-4">
                      {/* Contact Info */}
                      <div className="bg-neutral-50 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h4>{t('booking.checkout.contactInformation')}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(1)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          >
                            {t('booking.checkout.edit')}
                          </Button>
                        </div>
                        <div className="text-sm text-neutral-600 space-y-1">
                          <p className="text-neutral-900">{formData.name}</p>
                          <p>{formData.email}</p>
                          <p>{formData.phone}</p>
                        </div>
                      </div>

                      {/* Booking Summary */}
                      <div className="bg-neutral-50 rounded-xl p-5">
                        <h4 className="mb-4">{t('booking.checkout.ticketSummary')}</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-neutral-900">
                                  {bookingState.eventTitle}
                                </div>
                                <div className="text-sm text-neutral-600 mt-1">
                                  {bookingState.ticketTypeName}
                                </div>
                                <div className="text-sm text-neutral-500 mt-1">
                                  {bookingState.eventDate} • {bookingState.eventVenue}
                                </div>
                                {bookingState.selectedSeats.length > 0 && (
                                  <div className="text-sm text-neutral-500 mt-2">
                                    <strong>Seats:</strong>{' '}
                                    {bookingState.selectedSeats
                                      .map((s) => s.fullSeatCode)
                                      .join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-neutral-900">
                                  {formatPrice(subtotal)}
                                </div>
                                <div className="text-sm text-neutral-500 mt-1">
                                  Quantity: {bookingState.quantity}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-neutral-50 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h4>{t('booking.checkout.paymentMethod')}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(2)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          >
                            {t('booking.checkout.edit')}
                          </Button>
                        </div>
                        <div className="text-sm text-neutral-600">
                          {getPaymentMethodDisplay()}
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-800">
                          <strong>{t('booking.checkout.importantNote')}</strong> {t('booking.checkout.termsNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    {t('booking.checkout.back')}
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex-1 bg-teal-500 hover:bg-teal-600"
                  >
                    {t('booking.checkout.continueTo')} {steps[currentStep].label}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-teal-500 hover:bg-teal-600"
                    disabled={isProcessing}
                  >
                    <Lock size={16} className="mr-2" />
                    {isProcessing
                      ? t('booking.checkout.processing')
                      : `${t('booking.checkout.completePayment')} - ${formatPrice(total)}`}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <FeeBreakdown subtotal={subtotal} serviceFee={serviceFee} />

              {/* Order Items Preview */}
              <div className="mt-4 bg-white rounded-xl p-5 shadow-sm">
                <h4 className="mb-4">{t('booking.checkout.orderItems')}</h4>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">
                        {bookingState.ticketTypeName}
                      </span>
                      <span className="text-neutral-900">
                        ×{bookingState.quantity}
                      </span>
                    </div>
                    {bookingState.selectedSeats.length > 0 && (
                      <div className="text-xs text-neutral-500 mt-2">
                        Seats: {bookingState.selectedSeats.map(s => s.fullSeatCode).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
