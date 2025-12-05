import { Separator } from "./ui/separator";
import { useTranslation } from "react-i18next";

interface FeeBreakdownProps {
  subtotal: number;
  serviceFee: number;
  discount?: number;
  className?: string;
}

export function FeeBreakdown({
  subtotal,
  serviceFee,
  discount = 0,
  className = "",
}: FeeBreakdownProps) {
  const { t } = useTranslation();
  const total = subtotal + serviceFee - discount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className={`bg-neutral-50 rounded-xl p-6 ${className}`}>
      <h3 className="mb-4">{t("booking.checkout.priceSummary")}</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-neutral-600">
          <span>{t("booking.checkout.subtotal")}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>{t("booking.checkout.serviceFee")} (5%)</span>
          <span>{formatPrice(serviceFee)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>{t("booking.checkout.discount")}</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-neutral-900">
          <span>{t("booking.checkout.total")}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
