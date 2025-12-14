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
    const response = await apiClient.get<WaitlistDto[]>('/waitlist/my');
    // apiClient interceptor already unwraps ApiResponse, so response.data is the actual data
    const entries = Array.isArray(response.data) ? response.data : [];
    console.log('getMyWaitlist response:', entries);
    return entries;
  }

  async joinWaitlist(dto: JoinWaitlistDto): Promise<WaitlistDto> {
    const response = await apiClient.post<WaitlistDto>('/waitlist/join', dto);
    // apiClient interceptor already unwraps ApiResponse
    return response.data;
  }

  async leaveWaitlist(waitlistId: number): Promise<void> {
    await apiClient.delete(`/waitlist/${waitlistId}`);
  }

  async checkWaitlist(eventId: number, ticketTypeId?: number): Promise<boolean> {
    const params = ticketTypeId ? { ticketTypeId } : {};
    const response = await apiClient.get<boolean>(`/waitlist/check/${eventId}`, { params });
    // apiClient interceptor already unwraps ApiResponse, so response.data is the boolean directly
    console.log('checkWaitlist response:', response.data);
    return !!response.data;
  }
}

export const waitlistService = new WaitlistService();
