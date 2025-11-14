import { useState } from "react";
import { Trash2, Tag, ShoppingBag, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FeeBreakdown } from "../components/FeeBreakdown";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { mockEvents } from "../mockData";
import { CartItem } from "../types";
import { promoCodeService } from "../services/promoCodeService";

interface CartProps {
  items: CartItem[];
  onNavigate: (page: string) => void;
  onUpdateCart: (items: CartItem[]) => void;
}

export function Cart({ items, onNavigate, onUpdateCart }: CartProps) {
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
      const eventId = items[0]?.eventId;
      if (!eventId) {
        setPromoError("No items in cart");
        return;
      }

      const result = await promoCodeService.validatePromoCode({
        promoCode: promoCode.trim(),
        eventId,
        totalAmount: subtotal,
      });

      if (result.isValid) {
        setDiscount(result.discountAmount);
        setPromoError("");
      } else {
        setDiscount(0);
        setPromoError(result.message || "Invalid promo code");
      }
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
          <h2 className="mb-2">Your cart is empty</h2>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            Start exploring amazing events and add tickets to your cart to get
            started!
          </p>
          <Button
            onClick={() => onNavigate("home")}
            className="bg-teal-500 hover:bg-teal-600"
          >
            <ArrowLeft size={16} className="mr-2" />
            Browse Events
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
          <h1 className="mb-2">Shopping Cart</h1>
          <p className="text-neutral-600">
            {items.length} {items.length === 1 ? "item" : "items"} in your cart
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
                        <span className="text-neutral-500">Date</span>
                        <p className="text-neutral-900">
                          {formatDate(item.eventDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Venue</span>
                        <p className="text-neutral-900">{item.eventVenue}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Ticket Details & Pricing */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-500 mb-1">
                        Ticket Type
                      </div>
                      <div className="text-neutral-900">{item.tierName}</div>
                      <div className="text-sm text-neutral-600 mt-1">
                        {formatPrice(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-500 mb-1">
                        Subtotal
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
                  <h4>Have a promo code?</h4>
                  <p className="text-sm text-neutral-600">
                    Enter it here to get a discount
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
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
                  {isValidatingPromo ? "Checking..." : "Apply"}
                </Button>
              </div>
              {discount > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="text-green-600" size={16} />
                  <p className="text-sm text-green-700">
                    Promo code applied! You saved {formatPrice(discount)}
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
                Proceed to Checkout
              </Button>

              <Button
                onClick={() => onNavigate("home")}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft size={16} className="mr-2" />
                Continue Shopping
              </Button>

              {/* Trust Indicators */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h5 className="text-sm mb-3">Why book with Tickify?</h5>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>Secure payment processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>Instant ticket delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>24/7 customer support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>Flexible refund policy</span>
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
