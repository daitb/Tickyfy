import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useWishlistContext } from "../contexts/WishlistContext";
import { cn } from "./ui/utils";

interface WishlistButtonProps {
  eventId: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal";
  showLabel?: boolean;
  className?: string;
}

export function WishlistButton({
  eventId,
  size = "md",
  variant = "default",
  showLabel = false,
  className,
}: WishlistButtonProps) {
  const { t } = useTranslation();
  const { isInWishlist, toggleWishlist, isLoading } = useWishlistContext();

  const isInWishlistState = isInWishlist(eventId);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const wasInWishlist = isInWishlistState;

    try {
      await toggleWishlist(eventId);
      // Toast only after successful API call
      toast.success(
        wasInWishlist
          ? t("wishlist.removedFromWishlist", "Đã xóa khỏi yêu thích")
          : t("wishlist.addedToWishlist", "Đã thêm vào yêu thích")
      );
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || t("wishlist.errorToggle", "Không thể cập nhật yêu thích");
      toast.error(message);
    }
  };

  if (variant === "minimal") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-label={isInWishlistState ? t("wishlist.removeFromWishlist") : t("wishlist.addToWishlist")}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-200",
          "hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {isLoading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin text-neutral-400" />
        ) : (
          <Heart
            size={iconSizes[size]}
            className={cn(
              "transition-colors",
              isInWishlistState
                ? "text-red-500 fill-red-500"
                : "text-neutral-400 hover:text-red-400"
            )}
          />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isInWishlistState ? t("wishlist.removeFromWishlist") : t("wishlist.addToWishlist")}
      className={cn(
        sizeClasses[size],
        "inline-flex items-center justify-center rounded-full bg-white shadow-md",
        "hover:bg-red-50 transition-all duration-200",
        "hover:scale-110 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isInWishlistState && "bg-red-50",
        className
      )}
    >
      {isLoading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin text-red-500" />
      ) : (
        <Heart
          size={iconSizes[size]}
          className={cn(
            "transition-colors",
            isInWishlistState ? "text-red-500 fill-red-500" : "text-neutral-600 hover:text-red-500"
          )}
        />
      )}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {isInWishlistState ? t("wishlist.saved") : t("wishlist.save")}
        </span>
      )}
    </button>
  );
}
