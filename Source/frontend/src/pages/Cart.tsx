import { useState } from 'react';
import { Trash2, Tag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FeeBreakdown } from '../components/FeeBreakdown';
import { Separator } from '../components/ui/separator';
import { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  onNavigate: (page: string) => void;
  onUpdateCart: (items: CartItem[]) => void;
}

export function Cart({ items, onNavigate, onUpdateCart }: CartProps) {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdateCart(newItems);
  };

  const handleApplyPromo = () => {
    // Mock promo code validation
    if (promoCode.toUpperCase() === 'SAVE10') {
      setDiscount(subtotal * 0.1);
    } else if (promoCode) {
      alert('Invalid promo code');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = subtotal * 0.05;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-neutral-400 mb-4">
            <svg
              className="mx-auto h-24 w-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h2 className="mb-2">Your cart is empty</h2>
          <p className="text-neutral-600 mb-6">
            Browse events and add tickets to get started
          </p>
          <Button 
            onClick={() => onNavigate('home')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="mb-1">{item.eventTitle}</h3>
                    <div className="text-sm text-neutral-500 space-y-1">
                      <p>{formatDate(item.eventDate)}</p>
                      <p>{item.eventVenue}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-neutral-500">{item.tierName}</div>
                    <div className="text-neutral-900">
                      {item.quantity} × {formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="text-neutral-900">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            ))}

            {/* Promo Code */}
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Tag className="text-orange-500" size={20} />
                <h4>Promo Code</h4>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleApplyPromo}
                  variant="outline"
                >
                  Apply
                </Button>
              </div>
              {discount > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  Promo applied! You saved {formatPrice(discount)}
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <FeeBreakdown
                subtotal={subtotal}
                serviceFee={serviceFee}
                discount={discount}
              />
              
              <Button
                onClick={() => onNavigate('checkout')}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                size="lg"
              >
                Continue to Checkout
              </Button>

              <Button
                onClick={() => onNavigate('home')}
                variant="ghost"
                className="w-full mt-2"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
