import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Tag, ShoppingBag, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FeeBreakdown } from "../components/FeeBreakdown";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { mockEvents } from "../mockData";
import type { CartItem } from "../types";
import { promoCodeService } from "../services/promoCodeService";

interface CartProps {
  items: CartItem[];
  onNavigate: (page: string) => void;
  onUpdateCart: (items: CartItem[]) => void;
}

export function Cart({ items, onNavigate, onUpdateCart }: CartProps) {
  const { t } = useTranslation();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdateCart(newItems);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsValidatingPromo(true);
    setPromoError("");

    try {
      // Get first event ID from cart items
      const eventIdStr = items[0]?.eventId;
      if (!eventIdStr) {
        setPromoError("No items in cart");
        return;
      }

      // Parse eventId from string to number
      const eventId = parseInt(eventIdStr, 10);
      if (isNaN(eventId)) {
        setPromoError("Invalid event ID");
        return;
      }

      // Validate promo code first
      await promoCodeService.validatePromoCode({
        promoCode: promoCode.trim(),
        eventId,
        totalAmount: subtotal,
      });

      // If validation succeeds, calculate discount
      const discountAmount = await promoCodeService.calculateDiscount({
        promoCode: promoCode.trim(),
        eventId,
        totalAmount: subtotal,
      });

      setDiscount(discountAmount);
      setPromoError("");
    } catch (error: any) {
      console.error("Promo validation error:", error);
      setDiscount(0);
      setPromoError(
        error.response?.data?.message || "Failed to validate promo code"
      );
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const serviceFee = subtotal * 0.05;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center px-4">
          <ShoppingBag
            className="mx-auto mb-4 text-neutral-300"
            size={64}
            strokeWidth={1.5}
          />
          <h2 className="mb-2">{t("booking.cart.empty")}</h2>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            {t("booking.cart.emptyMessage")}
          </p>
          <Button
            onClick={() => onNavigate("home")}
            className="bg-teal-500 hover:bg-teal-600"
          >
            <ArrowLeft size={16} className="mr-2" />
            {t("booking.cart.browseEvents")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">{t("booking.cart.title")}</h1>
          <p className="text-neutral-600">
            {items.length}{" "}
            {items.length === 1
              ? t("booking.cart.item")
              : t("booking.cart.items")}{" "}
            {t("booking.cart.inCart")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => {
              const event = mockEvents.find((e) => e.id === item.eventId);

              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                  {/* Event Image & Title */}
                  <div className="flex gap-4 mb-4">
                    {event?.image && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                        <img
                          src={event.image}
                          alt={item.eventTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="mb-1">{item.eventTitle}</h3>
                          <Badge className="bg-teal-500">
                            {event?.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 -mt-2"
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-neutral-500">
                          {t("common.date")}
                        </span>
                        <p className="text-neutral-900">
                          {formatDate(item.eventDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-neutral-500">
                          {t("common.venue")}
                        </span>
                        <p className="text-neutral-900">{item.eventVenue}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Ticket Details & Pricing */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-500 mb-1">
                        {t("booking.ticketType")}
                      </div>
                      <div className="text-neutral-900">{item.tierName}</div>
                      <div className="text-sm text-neutral-600 mt-1">
                        {formatPrice(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-500 mb-1">
                        {t("booking.subtotal")}
                      </div>
                      <div className="text-neutral-900">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Promo Code */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <Tag className="text-teal-500" size={20} />
                </div>
                <div>
                  <h4>{t("booking.cart.havePromoCode")}</h4>
                  <p className="text-sm text-neutral-600">
                    {t("booking.cart.enterDiscount")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t("booking.cart.enterPromoCode")}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyPromo}
                  variant="outline"
                  className="border-teal-500 text-teal-600 hover:bg-teal-50"
                  disabled={isValidatingPromo}
                >
                  {isValidatingPromo ? t("common.checking") : t("common.apply")}
                </Button>
              </div>
              {discount > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="text-green-600" size={16} />
                  <p className="text-sm text-green-700">
                    {t("booking.cart.promoApplied")} {formatPrice(discount)}
                  </p>
                </div>
              )}
              {promoError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="text-red-600" size={16} />
                  <p className="text-sm text-red-700">{promoError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <FeeBreakdown
                subtotal={subtotal}
                serviceFee={serviceFee}
                discount={discount}
              />

              <Button
                onClick={() => onNavigate("checkout")}
                className="w-full bg-teal-500 hover:bg-teal-600"
                size="lg"
              >
                {t("booking.cart.proceedToCheckout")}
              </Button>

              <Button
                onClick={() => onNavigate("home")}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft size={16} className="mr-2" />
                {t("booking.cart.continueShopping")}
              </Button>

              {/* Trust Indicators */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h5 className="text-sm mb-3">{t("booking.cart.whyBook")}</h5>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>{t("booking.cart.securePayment")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>{t("booking.cart.instantDelivery")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>{t("booking.cart.support24")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>{t("booking.cart.flexibleRefund")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
