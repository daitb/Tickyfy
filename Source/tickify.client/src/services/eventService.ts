import apiClient from "./apiClient";
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
    throw new Error('Invalid event data');
  }
  
  const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
  const title = dto.title || 'Untitled Event';
  
  return {
    id: String(dto.eventId),
    title: title,
    slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    category: (dto.categoryName as any) || 'Other',
    image: dto.imageUrl || '',
    date: dto.startDate || new Date().toISOString(),
    time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    venue: dto.venue || '',
    city: dto.venue ? (dto.venue.split(',').pop()?.trim() || '') : '',
    description: title,
    organizerId: '',
    organizerName: dto.organizerName || '',
    ticketTiers: [], // Will be populated from detail
    policies: {
      refundable: true,
      transferable: true,
    },
    status: (dto.status?.toLowerCase() || 'published') as 'draft' | 'published' | 'cancelled',
    createdAt: dto.startDate || new Date().toISOString(),
  };
}

// Helper function to map backend EventDetailDto to frontend Event format
function mapEventDetailToEvent(dto: EventDetailDto): Event {
  if (!dto || !dto.eventId) {
    throw new Error('Invalid event detail data');
  }
  
  const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
  const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
  const title = dto.title || 'Untitled Event';
  
  const ticketTiers: TicketTier[] = (dto.ticketTypes || []).map(tt => ({
    id: String(tt.ticketTypeId || ''),
    name: tt.typeName || '',
    price: Number(tt.price || 0),
    available: tt.availableQuantity || 0,
    total: tt.quantity || 0,
    description: tt.description || '',
  }));

  return {
    id: String(dto.eventId),
    title: title,
    slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    category: (dto.categoryName as any) || 'Other',
    image: dto.imageUrl || '',
    date: dto.startDate || new Date().toISOString(),
    time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    venue: dto.venue || '',
    city: dto.venue ? (dto.venue.split(',').pop()?.trim() || '') : '',
    description: dto.description || title,
    fullDescription: dto.description || title,
    organizerId: String(dto.organizerId || ''),
    organizerName: dto.organizerName || '',
    ticketTiers,
    policies: {
      refundable: true,
      transferable: true,
    },
    status: (dto.status?.toLowerCase() || 'published') as 'draft' | 'published' | 'cancelled',
    createdAt: dto.createdAt || new Date().toISOString(),
  };
}

class EventService {
  /**
   * Get event by ID
   */
  async getEventById(id: number): Promise<Event> {
    try {
      const resp = await apiClient.get<EventDetailDto>(`/Event/${id}`);
      return mapEventDetailToEvent(resp.data);
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Attempts to fetch an event by numeric id or by slug (falls back to scanning list)
   */
  async getEventByIdentifier(identifier: string | number): Promise<Event | null> {
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
   */
  async getEvents(): Promise<Event[]> {
    try {
      const resp = await apiClient.get<PagedResult<EventListDto>>(`/Event`);
      // Handle both PagedResult and direct array response
      if (resp.data && 'items' in resp.data && Array.isArray(resp.data.items)) {
        return resp.data.items
          .filter(item => item && item.eventId)
          .map(mapEventListToEvent);
      }
      // If it's already an array (after interceptor unwrapping)
      if (Array.isArray(resp.data)) {
        return resp.data
          .filter(item => item && item.eventId)
          .map(mapEventListToEvent);
      }
      return [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(count: number = 10): Promise<Event[]> {
    try {
      const resp = await apiClient.get<EventListDto[]>(`/Event/featured?count=${count}`);
      // Response is already unwrapped by interceptor, should be array
      if (Array.isArray(resp.data)) {
        return resp.data
          .filter(item => item && item.eventId)
          .map(mapEventListToEvent);
      }
      return [];
    } catch (error) {
      console.error('Error fetching featured events:', error);
      return [];
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(count: number = 20): Promise<Event[]> {
    try {
      const resp = await apiClient.get<EventListDto[]>(`/Event/upcoming?count=${count}`);
      // Response is already unwrapped by interceptor, should be array
      if (Array.isArray(resp.data)) {
        return resp.data
          .filter(item => item && item.eventId)
          .map(mapEventListToEvent);
      }
      return [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }

  /**
   * Search events
   */
  async searchEvents(query: string, pageNumber: number = 1, pageSize: number = 20): Promise<Event[]> {
    const resp = await apiClient.get<PagedResult<EventListDto>>(
      `/Event/search?q=${encodeURIComponent(query)}&pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return resp.data.items.map(mapEventListToEvent);
  }
}

export const eventService = new EventService();
