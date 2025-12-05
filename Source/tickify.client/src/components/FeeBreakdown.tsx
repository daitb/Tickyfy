import { Separator } from './ui/separator';

interface FeeBreakdownProps {
  subtotal: number;
  serviceFee: number;
  discount?: number;
  className?: string;
}

export function FeeBreakdown({ subtotal, serviceFee, discount = 0, className = '' }: FeeBreakdownProps) {
  const total = subtotal + serviceFee - discount;

  // Debug log
  console.log('[FeeBreakdown] Rendering with:', {
    subtotal,
    serviceFee,
    discount,
    total
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className={`bg-neutral-50 rounded-xl p-6 ${className}`}>
      <h3 className="mb-4">Price Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Service Fee (5%)</span>
          <span>{formatPrice(serviceFee)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-neutral-900">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
