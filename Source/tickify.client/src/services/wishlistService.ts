import apiClient from "./apiClient";

export interface WishlistItemDto {
  wishlistId: number;
  userId: number;
  eventId: number;
  eventTitle: string;
  eventImageUrl?: string;
  eventStartDate: string;
  eventVenue: string;
  eventCity: string;
  eventCategory: string;
  eventStatus: string;
  minPrice: number;
  maxPrice: number;
  availableTickets: number;
  totalTickets: number;
  isEventActive: boolean;
  addedAt: string;
}

export interface PagedWishlistResult {
  items: WishlistItemDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

class WishlistService {
  async getWishlist(pageNumber = 1, pageSize = 100): Promise<WishlistItemDto[]> {
    const response = await apiClient.get<PagedWishlistResult>(
      `/wishlist?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response.data.items;
  }

  async addToWishlist(eventId: number): Promise<WishlistItemDto> {
    const response = await apiClient.post<WishlistItemDto>("/wishlist", {
      eventId,
    });
    return response.data;
  }

  async removeFromWishlist(eventId: number): Promise<void> {
    await apiClient.delete(`/wishlist/${eventId}`);
  }

  async isInWishlist(eventId: number): Promise<boolean> {
    const response = await apiClient.get<{ isInWishlist: boolean }>(
      `/wishlist/check/${eventId}`
    );
    return response.data.isInWishlist;
  }

  async getWishlistCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>(`/wishlist/count`);
    return response.data.count;
  }
}

export const wishlistService = new WishlistService();

