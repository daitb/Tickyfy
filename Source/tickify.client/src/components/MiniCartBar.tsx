import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';

interface MiniCartBarProps {
  itemCount: number;
  subtotal: number;
  onCheckout: () => void;
}

export function MiniCartBar({ itemCount, subtotal, onCheckout }: MiniCartBarProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingCart size={20} className="text-orange-500" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">{itemCount} ticket{itemCount > 1 ? 's' : ''} selected</div>
              <div className="text-neutral-900">{formatPrice(subtotal)}</div>
            </div>
          </div>
          <Button 
            onClick={onCheckout}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 px-8"
          >
            Continue to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
