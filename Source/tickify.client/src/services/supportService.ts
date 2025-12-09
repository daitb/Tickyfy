import apiClient from "./apiClient";

// ===== SUPPORT DTOs =====
export interface CreateSupportTicketDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SupportTicketDto {
  ticketId: number;
  userId?: number;
  name: string;
  email: string;
  subject: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
  updatedAt?: string;
  messageCount: number;
}

export interface SupportTicketDetailDto {
  ticketId: number;
  userId?: number;
  name: string;
  email: string;
  subject: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
  updatedAt?: string;
  messages: SupportMessageDto[];
}

export interface SupportMessageDto {
  messageId: number;
  ticketId: number;
  senderId: number;
  senderName: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
}

export interface AddMessageDto {
  message: string;
}

export interface AssignTicketRequest {
  staffId: number;
}

export interface UpdatePriorityRequest {
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

// ===== SUPPORT SERVICE =====
class SupportService {
  /**
   * POST /api/support/tickets - Create new support ticket
   */
  async createSupportTicket(dto: CreateSupportTicketDto): Promise<SupportTicketDetailDto> {
    const response = await apiClient.post<SupportTicketDetailDto>('/support/tickets', dto);
    return response.data;
  }

  /**
   * GET /api/support/tickets - Get all support tickets with filters
   */
  async getSupportTickets(status?: string): Promise<SupportTicketDto[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<SupportTicketDto[]>('/support/tickets', { params });
    return response.data;
  }

  /**
   * GET /api/support/tickets/{id} - Get support ticket details
   */
  async getSupportTicketById(id: number): Promise<SupportTicketDetailDto> {
    const response = await apiClient.get<SupportTicketDetailDto>(`/support/tickets/${id}`);
    return response.data;
  }

  /**
   * POST /api/support/tickets/{id}/messages - Add message to support ticket
   */
  async addMessageToTicket(id: number, dto: AddMessageDto): Promise<SupportMessageDto> {
    const response = await apiClient.post<SupportMessageDto>(`/support/tickets/${id}/messages`, dto);
    return response.data;
  }

  /**
   * POST /api/support/tickets/{id}/assign - Assign ticket to staff (Admin only)
   */
  async assignTicketToStaff(id: number, staffId: number): Promise<SupportTicketDto> {
    const response = await apiClient.post<SupportTicketDto>(
      `/support/tickets/${id}/assign`,
      { staffId }
    );
    return response.data;
  }

  /**
   * POST /api/support/tickets/{id}/resolve - Resolve support ticket
   */
  async resolveTicket(id: number): Promise<SupportTicketDto> {
    const response = await apiClient.post<SupportTicketDto>(`/support/tickets/${id}/resolve`);
    return response.data;
  }

  /**
   * PUT /api/support/tickets/{id}/priority - Update ticket priority (Admin only)
   */
  async updateTicketPriority(id: number, priority: string): Promise<SupportTicketDto> {
    const response = await apiClient.put<SupportTicketDto>(
      `/support/tickets/${id}/priority`,
      { priority }
    );
    return response.data;
  }
}

export const supportService = new SupportService();
