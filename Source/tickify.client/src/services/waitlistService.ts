import apiClient from "./apiClient";

// ===== API RESPONSE WRAPPER =====
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

// ===== WAITLIST DTOs =====
export interface JoinWaitlistDto {
  eventId: number;
  ticketTypeId?: number;
  requestedQuantity?: number;
  notes?: string;
}

export interface WaitlistDto {
  waitlistId: number;
  userId: number;
  userName: string;
  userEmail: string;
  eventId: number;
  eventTitle: string;
  eventBanner?: string;
  eventDate: string;
  eventLocation?: string;
  ticketTypeId?: number;
  ticketTypeName?: string;
  requestedQuantity: number;
  status: string; // 'active' | 'notified' | 'expired' | 'purchased'
  isNotified: boolean;
  notifiedAt?: string;
  expiresAt?: string;
  hasPurchased: boolean;
  joinedAt: string;
  position: number;
}

// ===== WAITLIST SERVICE =====
class WaitlistService {
  /**
   * GET /api/waitlist/my - Get current user's waitlist entries
   */
  async getMyWaitlist(): Promise<WaitlistDto[]> {
    const response = await apiClient.get<ApiResponse<WaitlistDto[]>>('/waitlist/my');
    return response.data.data || [];
  }

  /**
   * POST /api/waitlist/join - Join waitlist for an event
   */
  async joinWaitlist(dto: JoinWaitlistDto): Promise<WaitlistDto> {
    const response = await apiClient.post<ApiResponse<WaitlistDto>>('/waitlist/join', dto);
    return response.data.data;
  }

  /**
   * DELETE /api/waitlist/{id} - Leave waitlist
   */
  async leaveWaitlist(waitlistId: number): Promise<void> {
    await apiClient.delete(`/waitlist/${waitlistId}`);
  }

  /**
   * GET /api/waitlist/check/{eventId} - Check if user is on waitlist
   */
  async checkWaitlist(eventId: number, ticketTypeId?: number): Promise<boolean> {
    const params = ticketTypeId ? { ticketTypeId } : {};
    const response = await apiClient.get<ApiResponse<boolean>>(`/waitlist/check/${eventId}`, { params });
    return response.data.data || false;
  }
}

export const waitlistService = new WaitlistService();
