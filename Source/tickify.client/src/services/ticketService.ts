import apiClient from "./apiClient";

// ===== INTERFACES =====
// Matches TicketDetailDto from backend
export interface TicketDto {
  ticketId: number;
  ticketNumber: string;
  bookingId: number;
  bookingNumber: string;
  eventId: number;
  eventTitle: string;
  eventVenue: string;
  eventStartDate: string;
  eventEndDate: string;
  ticketTypeName: string;
  price: number;
  seatId?: number;
  row?: string;
  seatNumber?: string;
  status: string;
  qrCode?: string;
  isUsed: boolean;
  usedAt?: string;
  allowTransfer: boolean;
  allowRefund: boolean;
  createdAt: string;
}

export interface TransferTicketDto {
  recipientEmail: string;
  recipientName: string;
}

// ===== TICKET SERVICE =====
class TicketService {
  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string): Promise<TicketDto> {
    const response = await apiClient.get<TicketDto>(`/tickets/${ticketId}`);
    return response.data;
  }

  /**
   * Get all tickets for current user
   */
  async getMyTickets(): Promise<TicketDto[]> {
    const response = await apiClient.get<TicketDto[]>("/tickets/my-tickets");
    return response.data;
  }

  /**
   * Transfer ticket to another user
   */
  async transferTicket(
    ticketId: string,
    data: TransferTicketDto
  ): Promise<void> {
    await apiClient.post(`/tickets/${ticketId}/transfer`, data);
  }

  /**
   * Cancel a ticket
   */
  async cancelTicket(ticketId: string): Promise<void> {
    await apiClient.post(`/tickets/${ticketId}/cancel`);
  }

  /**
   * Validate ticket (for QR scanning)
   */
  async validateTicket(
    ticketId: string
  ): Promise<{ isValid: boolean; message: string }> {
    const response = await apiClient.post<{
      isValid: boolean;
      message: string;
    }>(`/tickets/${ticketId}/validate`);
    return response.data;
  }

  /**
   * Check in ticket
   */
  async checkInTicket(ticketId: string): Promise<void> {
    await apiClient.post(`/tickets/${ticketId}/check-in`);
  }

  /**
   * Download ticket as PDF
   */
  async downloadTicket(ticketId: string): Promise<Blob> {
    const response = await apiClient.get(`/tickets/${ticketId}/download`, {
      responseType: "blob",
    });
    return response.data;
  }
}

export const ticketService = new TicketService();
