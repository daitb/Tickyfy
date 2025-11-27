import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { wishlistService } from "../services/wishlistService";
import { authService } from "../services/authService";

interface WishlistContextType {
  wishlistEventIds: Set<number>;
  wishlistCount: number;
  isLoading: boolean;
  isInWishlist: (eventId: number) => boolean;
  toggleWishlist: (eventId: number) => Promise<void>;
  refreshWishlistStatus: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistEventIds, setWishlistEventIds] = useState<Set<number>>(new Set());
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist status on mount
  const refreshWishlistStatus = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setWishlistEventIds(new Set());
      setWishlistCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const [items, count] = await Promise.all([
        wishlistService.getWishlist(),
        wishlistService.getWishlistCount(),
      ]);
      
      const eventIds = new Set(items.map((item) => item.eventId));
      setWishlistEventIds(eventIds);
      setWishlistCount(count);
    } catch (error) {
      console.error("Failed to load wishlist status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWishlistStatus();
  }, [refreshWishlistStatus]);

  // Listen for auth changes
  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        setWishlistEventIds(new Set());
        setWishlistCount(0);
      } else {
        refreshWishlistStatus();
      }
    };

    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, [refreshWishlistStatus]);

  const isInWishlist = useCallback(
    (eventId: number): boolean => {
      return wishlistEventIds.has(eventId);
    },
    [wishlistEventIds]
  );

  const toggleWishlist = useCallback(
    async (eventId: number) => {
      // Capture current state BEFORE any updates
      const wasInWishlist = wishlistEventIds.has(eventId);
      
      // Optimistic update - update UI immediately
      setWishlistEventIds((prev) => {
        const newSet = new Set(prev);
        if (wasInWishlist) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);
        }
        return newSet;
      });
      
      setWishlistCount((c) => wasInWishlist ? Math.max(0, c - 1) : c + 1);

      // Execute API call in background
      try {
        if (wasInWishlist) {
          await wishlistService.removeFromWishlist(eventId);
        } else {
          await wishlistService.addToWishlist(eventId);
        }
      } catch (error) {
        // Revert on error
        setWishlistEventIds((prev) => {
          const revertSet = new Set(prev);
          if (wasInWishlist) {
            revertSet.add(eventId);
          } else {
            revertSet.delete(eventId);
          }
          return revertSet;
        });
        
        setWishlistCount((c) => wasInWishlist ? c + 1 : Math.max(0, c - 1));
        
        throw error;
      }
    },
    [wishlistEventIds]
  );

  const value: WishlistContextType = {
    wishlistEventIds,
    wishlistCount,
    isLoading,
    isInWishlist,
    toggleWishlist,
    refreshWishlistStatus,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlistContext must be used within a WishlistProvider");
  }
  return context;
}

