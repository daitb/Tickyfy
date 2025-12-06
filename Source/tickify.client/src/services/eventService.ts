import apiClient from "./apiClient";
import { toast } from "sonner";
import type { Event, TicketTier } from "../types";

// Backend DTOs
export interface EventListDto {
  eventId: number;
  title: string;
  venue: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  categoryName: string;
  organizerName: string;
  availableSeats: number;
  minPrice: number;
  maxPrice: number;
  isFeatured: boolean;
  status: string;
}

export interface EventDetailDto {
  eventId: number;
  title: string;
  description: string;
  venue: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  totalSeats: number;
  availableSeats: number;
  isFeatured: boolean;
  status: string;
  categoryId: number;
  categoryName: string;
  organizerId: number;
  organizerName: string;
  organizerEmail?: string;
  ticketTypes: TicketTypeDto[];
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketTypeDto {
  ticketTypeId: number;
  typeName: string;
  price: number;
  quantity: number;
  availableQuantity: number;
  description?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Helper function to map backend EventListDto to frontend Event format
function mapEventListToEvent(dto: EventListDto): Event {
  if (!dto || !dto.eventId) {
    throw new Error("Invalid event data");
  }

  const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
  const title = dto.title || "Untitled Event";

  // Debug: Log backend prices
  console.log(
    "Backend data for",
    title,
    "- minPrice:",
    dto.minPrice,
    "maxPrice:",
    dto.maxPrice
  );

  // Create placeholder ticket tiers from minPrice and maxPrice for list view
  const ticketTiers: TicketTier[] = [];
  if (dto.minPrice > 0) {
    ticketTiers.push({
      id: "min",
      name: "Starting from",
      price: dto.minPrice,
      available: dto.availableSeats || 0,
      total: dto.availableSeats || 0,
    });
  }
  // Only add max price if it exists and is different from min
  if (dto.maxPrice && dto.maxPrice > 0 && dto.maxPrice !== dto.minPrice) {
    ticketTiers.push({
      id: "max",
      name: "Up to",
      price: dto.maxPrice,
      available: 0,
      total: 0,
    });
  }

  return {
    id: String(dto.eventId),
    title: title,
    slug: title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""),
    category: (dto.categoryName as any) || "Other",
    image: dto.imageUrl || "",
    date: dto.startDate || new Date().toISOString(),
    time: startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    venue: dto.venue || "",
    city: dto.venue ? dto.venue.split(",").pop()?.trim() || "" : "",
    description: title,
    organizerId: "",
    organizerName: dto.organizerName || "",
    ticketTiers,
    policies: {
      refundable: true,
      transferable: true,
    },
    status: (dto.status?.toLowerCase() || "published") as
      | "draft"
      | "published"
      | "cancelled",
    createdAt: dto.startDate || new Date().toISOString(),
  };
}

// Helper function to map backend EventDetailDto to frontend Event format
function mapEventDetailToEvent(dto: EventDetailDto): Event {
  if (!dto || !dto.eventId) {
    throw new Error("Invalid event detail data");
  }

  const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
  const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
  const title = dto.title || "Untitled Event";

  const ticketTiers: TicketTier[] = (dto.ticketTypes || []).map((tt) => ({
    id: String(tt.ticketTypeId || ""),
    name: tt.typeName || "",
    price: Number(tt.price || 0),
    available: tt.availableQuantity || 0,
    total: tt.quantity || 0,
    description: tt.description || "",
  }));

  return {
    id: String(dto.eventId),
    title: title,
    slug: title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""),
    category: (dto.categoryName as any) || "Other",
    image: dto.imageUrl || "",
    date: dto.startDate || new Date().toISOString(),
    time: startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    venue: dto.venue || "",
    city: dto.venue ? dto.venue.split(",").pop()?.trim() || "" : "",
    description: dto.description || title,
    fullDescription: dto.description || title,
    organizerId: String(dto.organizerId || ""),
    organizerName: dto.organizerName || "",
    ticketTiers,
    policies: {
      refundable: true,
      transferable: true,
    },
    status: (dto.status?.toLowerCase() || "published") as
      | "draft"
      | "published"
      | "cancelled",
    createdAt: dto.createdAt || new Date().toISOString(),
  };
}

class EventService {
  /**
   * Get event by ID
   */
  async getEventById(id: number): Promise<Event> {
    try {
      const resp = await apiClient.get<EventDetailDto>(`/events/${id}`);
      return mapEventDetailToEvent(resp.data);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        `Không thể tải thông tin sự kiện. Vui lòng thử lại.`;
      toast.error(errorMsg);
      throw error;
    }
  }

  /**
   * Attempts to fetch an event by numeric id or by slug (falls back to scanning list)
   */
  async getEventByIdentifier(
    identifier: string | number
  ): Promise<Event | null> {
    if (typeof identifier === "number") {
      try {
        return await this.getEventById(identifier);
      } catch {
        return null;
      }
    }

    // try numeric suffix first
    const s = String(identifier);
    const m = s.match(/(\d+)$/);
    if (m) {
      try {
        return await this.getEventById(parseInt(m[1], 10));
      } catch {
        // continue to slug lookup
      }
    }

    // fallback: fetch all events and find by id
    try {
      const list = await this.getEvents();
      const found = list.find((e) => String(e.id) === s || String(e.id) === s);
      if (found) {
        // Fetch full details
        return await this.getEventById(Number(found.id));
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get all events (returns list format)
   * Only returns Published events for public view
   */
  async getEvents(): Promise<Event[]> {
    try {
      // Filter to only show Published events on public pages
      const resp = await apiClient.get<PagedResult<EventListDto>>(
        `/events?Status=Published`
      );
      // Handle both PagedResult and direct array response
      if (resp.data && "items" in resp.data && Array.isArray(resp.data.items)) {
        return resp.data.items
          .filter((item) => item && item.eventId)
          .map(mapEventListToEvent);
      }
      // If it's already an array (after interceptor unwrapping)
      if (Array.isArray(resp.data)) {
        return resp.data
          .filter((item) => item && item.eventId)
          .map(mapEventListToEvent);
      }
      return [];
    } catch (error: any) {
      // Silent fail for events list, return empty array
      return [];
    }
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(count: number = 10): Promise<Event[]> {
    try {
      const resp = await apiClient.get<EventListDto[]>(
        `/events/featured?count=${count}`
      );
      // Response is already unwrapped by interceptor, should be array
      if (Array.isArray(resp.data)) {
        return resp.data
          .filter((item) => item && item.eventId)
          .map(mapEventListToEvent);
      }
      return [];
    } catch (error: any) {
      // Silent fail for featured events, return empty array
      return [];
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(count: number = 20): Promise<Event[]> {
    try {
      const resp = await apiClient.get<EventListDto[]>(
        `/events/upcoming?count=${count}`
      );
      // Response is already unwrapped by interceptor, should be array
      if (Array.isArray(resp.data)) {
        return resp.data
          .filter((item) => item && item.eventId)
          .map(mapEventListToEvent);
      }
      return [];
    } catch (error: any) {
      // Silent fail for upcoming events, return empty array
      return [];
    }
  }

  /**
   * Search events
   */
  async searchEvents(
    query: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<Event[]> {
    const resp = await apiClient.get<PagedResult<EventListDto>>(
      `/events/search?q=${encodeURIComponent(
        query
      )}&pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return resp.data.items.map(mapEventListToEvent);
  }

  /**
   * POST /api/events - Create new event (Organizer only)
   */
  async createEvent(dto: CreateEventDto): Promise<Event> {
    const response = await apiClient.post<EventDetailDto>("/events", dto);
    return mapEventDetailToEvent(response.data);
  }

  /**
   * PUT /api/events/{id} - Update existing event (Organizer/Admin)
   */
  async updateEvent(id: number, dto: UpdateEventDto): Promise<Event> {
    const response = await apiClient.put<EventDetailDto>(`/events/${id}`, dto);
    return mapEventDetailToEvent(response.data);
  }

  /**
   * POST /api/events/{id}/publish - Publish event (Organizer only)
   */
  async publishEvent(id: number): Promise<Event> {
    const response = await apiClient.post<EventDetailDto>(
      `/events/${id}/publish`
    );
    return mapEventDetailToEvent(response.data);
  }

  /**
   * POST /api/events/{id}/approve - Approve event (Admin only)
   */
  async approveEvent(id: number): Promise<Event> {
    const response = await apiClient.post<EventDetailDto>(
      `/events/${id}/approve`
    );
    return mapEventDetailToEvent(response.data);
  }

  /**
   * POST /api/events/{id}/reject - Reject event (Admin only)
   */
  async rejectEvent(id: number, reason: string): Promise<Event> {
    const response = await apiClient.post<EventDetailDto>(
      `/events/${id}/reject`,
      { reason }
    );
    return mapEventDetailToEvent(response.data);
  }

  /**
   * POST /api/events/{id}/cancel - Cancel event
   */
  async cancelEvent(id: number, reason?: string): Promise<boolean> {
    const response = await apiClient.post<boolean>(`/events/${id}/cancel`, {
      reason,
    });
    return response.data;
  }

  /**
   * DELETE /api/events/{id} - Delete event (Admin only)
   */
  async deleteEvent(id: number): Promise<boolean> {
    const response = await apiClient.delete<boolean>(`/events/${id}`);
    return response.data;
  }

  /**
   * GET /api/events/{id}/stats - Get event statistics
   */
  async getEventStatistics(id: number): Promise<EventStatsDto> {
    const response = await apiClient.get<EventStatsDto>(`/events/${id}/stats`);
    return response.data;
  }

  /**
   * POST /api/events/{id}/duplicate - Duplicate event
   */
  async duplicateEvent(id: number): Promise<Event> {
    const response = await apiClient.post<EventDetailDto>(
      `/events/${id}/duplicate`
    );
    return mapEventDetailToEvent(response.data);
  }
}

// ===== Additional DTOs for Create/Update =====
export interface CreateEventDto {
  organizerId: number;
  categoryId: number;
  title: string;
  description: string;
  venue: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  totalSeats: number;
  isFeatured?: boolean;
  seatMapId?: number;
  ticketTypes?: CreateTicketTypeDto[];
}

export interface CreateTicketTypeDto {
  typeName: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface UpdateEventDto {
  categoryId: number;
  title: string;
  description: string;
  venue: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  totalSeats: number;
  isFeatured: boolean;
}

export interface EventStatsDto {
  eventId: number;
  title: string;
  totalSeats: number;
  soldSeats: number;
  availableSeats: number;
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
  pageViews?: number;
  revenueGrowth?: number;
  salesByTicketType: Array<{
    ticketTypeName: string;
    sold: number;
    revenue: number;
  }>;
  salesByDate: Array<{
    date: string;
    ticketsSold: number;
    revenue: number;
  }>;
  trafficSources?: Array<{
    sourceName: string;
    visits: number;
  }>;
  topBuyers?: Array<{
    userId: number;
    userName: string;
    email: string;
    ticketsPurchased: number;
    totalSpent: number;
    lastPurchaseDate: string;
  }>;
  recentTransactions?: Array<{
    transactionId: string;
    buyerName: string;
    amount: number;
    transactionDate: string;
    status: string;
  }>;
}

export const eventService = new EventService();
