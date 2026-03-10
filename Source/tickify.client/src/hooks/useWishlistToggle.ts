import { useWishlistContext } from "../contexts/WishlistContext";

interface UseWishlistToggleResult {
  isInWishlist: (eventId: number) => boolean;
  toggleWishlist: (eventId: number) => Promise<void>;
  wishlistEventIds: Set<number>;
  wishlistCount: number;
  isLoading: boolean;
  refreshWishlistStatus: () => Promise<void>;
}

/**
 * Global hook for managing wishlist state across the application.
 * This is now a wrapper around WishlistContext for backward compatibility.
 * Keeps track of which events are in the wishlist and provides
 * a consistent toggle function that updates all components.
 */
export function useWishlistToggle(): UseWishlistToggleResult {
  const context = useWishlistContext();
  
  return {
    isInWishlist: context.isInWishlist,
    toggleWishlist: context.toggleWishlist,
    wishlistEventIds: context.wishlistEventIds,
    wishlistCount: context.wishlistCount,
    isLoading: context.isLoading,
    refreshWishlistStatus: context.refreshWishlistStatus,
  };
}
