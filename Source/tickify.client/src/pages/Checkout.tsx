import { useState, useEffect } from "react";
import { Lock, CheckCircle, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ProgressSteps } from "../components/ProgressSteps";
import { FeeBreakdown } from "../components/FeeBreakdown";
import {
  PaymentMethodSelector,
  PaymentMethod,
} from "../components/PaymentMethodSelector";
import { Separator } from "../components/ui/separator";
import { eventService } from "../services/eventService";
import { CartItem, Order } from "../types";
import { bookingService } from "../services/bookingService";
import { authService } from "../services/authService";
import { createPaymentIntent } from "../services/paymentService";

interface CheckoutProps {
  items: CartItem[];
  onNavigate: (page: string) => void;
  onCompleteOrder: (order: Order) => void;
}

export function Checkout({
  items,
  onNavigate,
  onCompleteOrder,
}: CheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [eventsMap, setEventsMap] = useState<Record<number, any>>({});
  const steps = [
    { number: 1, label: "Information" },
    { number: 2, label: "Payment" },
    { number: 3, label: "Review" },
  ];

  // Utility: extract trailing numeric ID from strings like 'evt-1' or return number as-is
  const extractTrailingNumber = (val: string | number | undefined) => {
    if (typeof val === "number") return val;
    if (!val) return NaN;
    const s = String(val);
    const m = s.match(/(\d+)$/);
    return m ? parseInt(m[1], 10) : NaN;
  };

  // When cart items change, fetch event metadata from backend for display
  useEffect(() => {
    const ids = Array.from(
      new Set(
        items
          .map((i) => extractTrailingNumber(i.eventId))
          .filter((n) => !isNaN(n))
      )
    ) as number[];

    ids.forEach((id) => {
      if (eventsMap[id]) return;
      eventService
        .getEventById(id)
        .then((ev) => setEventsMap((prev) => ({ ...prev, [id]: ev })))
        .catch(() => {
          // ignore missing events for now
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="mx-auto mb-4 text-neutral-400" size={48} />
          <h2 className="mb-2">Your cart is empty</h2>
          <p className="text-neutral-600 mb-6">
            Add some tickets to get started!
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

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const serviceFee = subtotal * 0.05;
  const total = subtotal + serviceFee;

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePaymentMethodChange = (method: PaymentMethod, details?: any) => {
    setPaymentMethod(method);
    setPaymentDetails(details);
  };

  const handleNext = () => {
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
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        setError("Please login to complete your booking");
        onNavigate("login");
        return;
      }

      // Get first item (in real app, would handle multiple events)
      const firstItem = items[0];

      const eventId = extractTrailingNumber(firstItem.eventId);
      const ticketTypeId = extractTrailingNumber(firstItem.tierId);

      if (isNaN(eventId) || isNaN(ticketTypeId)) {
        setError("Invalid event or ticket type ID");
        return;
      }

      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

      // Create booking via API with numeric IDs
      const booking = await bookingService.createBooking({
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        quantity: totalQuantity,
      });

      console.log("Booking created:", booking);

      // Now create payment intent for the booking
      const paymentProviderMap: { [key in PaymentMethod]: "momo" | "vnpay" } = {
        momo: "momo",
        vnpay: "vnpay",
        "credit-card": "vnpay", // fallback to VNPay for credit cards
      };

      const provider = paymentProviderMap[paymentMethod];
      
      try {
        const paymentIntent = await createPaymentIntent({
          bookingId: parseInt(String(booking.bookingId), 10),
          provider: provider,
        });

        console.log("Payment intent created:", paymentIntent);

        // Redirect to payment provider
        if (paymentIntent.redirectUrl) {
          window.location.href = paymentIntent.redirectUrl;
        } else {
          setError("No payment redirect URL received from provider");
        }
      } catch (paymentErr: any) {
        console.error("Payment intent creation error:", paymentErr);
        setError(
          paymentErr.response?.data?.message ||
            "Failed to initiate payment. Please try again."
        );
      }
    } catch (err: any) {
      console.error("Booking creation error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create booking. Please try again."
      );
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
      return formData.email && formData.name && formData.phone;
    }
    if (currentStep === 2) {
      if (paymentMethod === "momo") {
        return paymentDetails?.phone;
      }
      if (paymentMethod === "vnpay") {
        return true; // VNPay doesn't require additional details
      }
      if (paymentMethod === "credit-card") {
        return (
          paymentDetails?.number &&
          paymentDetails?.name &&
          paymentDetails?.expiry &&
          paymentDetails?.cvv
        );
      }
    }
    return true;
  };

  const getPaymentMethodDisplay = () => {
    if (paymentMethod === "momo") return "MoMo E-Wallet";
    if (paymentMethod === "vnpay") return "VNPay Gateway";
    if (paymentMethod === "credit-card")
      return `Card ending in ${paymentDetails?.number?.slice(-4) || "****"}`;
    return "Not selected";
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Checkout</h1>
          <p className="text-neutral-600">
            Complete your purchase in just a few steps
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
                    <h3 className="mb-6">Contact Information</h3>
                    <p className="text-neutral-600 mb-6">
                      We'll send your tickets to this email address. Make sure
                      it's correct!
                    </p>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="mt-2"
                        />
                        <p className="text-xs text-neutral-500 mt-2">
                          📧 Your tickets and receipt will be sent here
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Nguyen Van A"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="mt-2"
                        />
                        <p className="text-xs text-neutral-500 mt-2">
                          Name as it appears on your ID
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="09xx xxx xxx"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="mt-2"
                        />
                        <p className="text-xs text-neutral-500 mt-2">
                          For order updates and confirmations
                        </p>
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
                        <p className="mb-1">Your information is secure</p>
                        <p className="text-xs">
                          We use industry-standard encryption to protect your
                          personal data.
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
                        <p className="mb-1">Your payment is secure</p>
                        <p className="text-xs">
                          All transactions are encrypted and processed securely
                          through our trusted payment partners. We never store
                          your full payment details.
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
                    <h3 className="mb-6">Review Your Order</h3>
                    <p className="text-neutral-600 mb-6">
                      Please review all details before completing your purchase.
                    </p>

                    <div className="space-y-4">
                      {/* Contact Info */}
                      <div className="bg-neutral-50 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h4>Contact Information</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(1)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          >
                            Edit
                          </Button>
                        </div>
                        <div className="text-sm text-neutral-600 space-y-1">
                          <p className="text-neutral-900">{formData.name}</p>
                          <p>{formData.email}</p>
                          <p>{formData.phone}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-neutral-50 rounded-xl p-5">
                        <h4 className="mb-4">Ticket Summary</h4>
                        <div className="space-y-3">
                          {items.map((item, index) => {
                                                  const numericEventId = extractTrailingNumber(item.eventId);
                                                  const event = eventsMap[numericEventId];
                            return (
                              <div key={index}>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="text-neutral-900">
                                      {item.eventTitle}
                                    </div>
                                    <div className="text-sm text-neutral-600 mt-1">
                                      {item.tierName}
                                    </div>
                                    <div className="text-sm text-neutral-500 mt-1">
                                      {event?.date} • {event?.venue}
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="text-neutral-900">
                                      {formatPrice(item.price * item.quantity)}
                                    </div>
                                    <div className="text-sm text-neutral-500 mt-1">
                                      Qty: {item.quantity}
                                    </div>
                                  </div>
                                </div>
                                {index < items.length - 1 && (
                                  <Separator className="mt-3" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-neutral-50 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h4>Payment Method</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(2)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          >
                            Edit
                          </Button>
                        </div>
                        <div className="text-sm text-neutral-600">
                          {getPaymentMethodDisplay()}
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-800">
                          <strong>Important:</strong> By completing this
                          purchase, you agree to our Terms of Service and
                          acknowledge our Refund Policy. Please review the
                          event's specific policies before proceeding.
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
                    Back
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex-1 bg-teal-500 hover:bg-teal-600"
                  >
                    Continue to {steps[currentStep].label}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-teal-500 hover:bg-teal-600"
                    disabled={isProcessing}
                  >
                    <Lock size={16} className="mr-2" />
                    {isProcessing
                      ? "Processing..."
                      : `Complete Payment - ${formatPrice(total)}`}
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
                <h4 className="mb-4">Order Items</h4>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">
                          {item.tierName}
                        </span>
                        <span className="text-neutral-900">
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
