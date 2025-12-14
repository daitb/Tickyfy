import apiClient from "./apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

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

class WaitlistService {
  async getMyWaitlist(): Promise<WaitlistDto[]> {
    const response = await apiClient.get<ApiResponse<WaitlistDto[]>>('/waitlist/my');
    return response.data.data || [];
  }

  async joinWaitlist(dto: JoinWaitlistDto): Promise<WaitlistDto> {
    const response = await apiClient.post<ApiResponse<WaitlistDto>>('/waitlist/join', dto);
    return response.data.data;
  }

  async leaveWaitlist(waitlistId: number): Promise<void> {
    await apiClient.delete(`/waitlist/${waitlistId}`);
  }

  async checkWaitlist(eventId: number, ticketTypeId?: number): Promise<boolean> {
    const params = ticketTypeId ? { ticketTypeId } : {};
    const response = await apiClient.get<ApiResponse<boolean>>(`/waitlist/check/${eventId}`, { params });
    return response.data.data || false;
  }
}

export const waitlistService = new WaitlistService();
