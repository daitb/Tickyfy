import { useCallback, useEffect, useMemo, useState } from "react";
import type { WishlistItem } from "../types";
import {
  wishlistService,
  type WishlistItemDto,
} from "../services/wishlistService";

interface UseWishlistResult {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  removeItem: (eventId: number) => Promise<void>;
  removeMany: (eventIds: number[]) => Promise<void>;
}

const mapDtoToWishlistItem = (dto: WishlistItemDto): WishlistItem => ({
  wishlistId: dto.wishlistId,
  eventId: dto.eventId,
  title: dto.eventTitle,
  imageUrl: dto.eventImageUrl,
  startDate: dto.eventStartDate,
  venue: dto.eventVenue,
  city: dto.eventCity,
  category: dto.eventCategory,
  status: dto.eventStatus,
  minPrice: Number(dto.minPrice),
  maxPrice: Number(dto.maxPrice),
  availableTickets: dto.availableTickets,
  totalTickets: dto.totalTickets,
  isEventActive: dto.isEventActive,
  addedAt: dto.addedAt,
});

export const useWishlist = (): UseWishlistResult => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wishlistService.getWishlist();
      setItems(data.map(mapDtoToWishlistItem));
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to load wishlist";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const removeItem = useCallback(async (eventId: number) => {
    await wishlistService.removeFromWishlist(eventId);
    setItems((prev) => prev.filter((item) => item.eventId !== eventId));
  }, []);

  const removeMany = useCallback(async (eventIds: number[]) => {
    await Promise.all(
      eventIds.map(async (eventId) => {
        try {
          await wishlistService.removeFromWishlist(eventId);
        } catch {
          // swallow errors for individual deletions; caller can refetch
        }
      })
    );
    setItems((prev) => prev.filter((item) => !eventIds.includes(item.eventId)));
  }, []);

  return useMemo(
    () => ({
      items,
      loading,
      error,
      refresh: fetchWishlist,
      removeItem,
      removeMany,
    }),
    [items, loading, error, fetchWishlist, removeItem, removeMany]
  );
};

