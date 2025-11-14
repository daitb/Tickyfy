import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface TicketDto {
  ticketId: string;
  bookingId: string;
  eventId: string;
  userId: string;
  ticketTypeId: string;
  seatNumber?: string;
  qrCode: string;
  status: string;
  price: number;
  isCheckedIn: boolean;
  checkedInAt?: string;
  event?: any;
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
    const response = await apiClient.get<TicketDto>(`/Ticket/${ticketId}`);
    return response.data;
  }

  /**
   * Get all tickets for current user
   */
  async getMyTickets(): Promise<TicketDto[]> {
    const response = await apiClient.get<TicketDto[]>("/Ticket/my-tickets");
    return response.data;
  }

  /**
   * Transfer ticket to another user
   */
  async transferTicket(
    ticketId: string,
    data: TransferTicketDto
  ): Promise<void> {
    await apiClient.post(`/Ticket/${ticketId}/transfer`, data);
  }

  /**
   * Cancel a ticket
   */
  async cancelTicket(ticketId: string): Promise<void> {
    await apiClient.post(`/Ticket/${ticketId}/cancel`);
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
    }>(`/Ticket/${ticketId}/validate`);
    return response.data;
  }

  /**
   * Check in ticket
   */
  async checkInTicket(ticketId: string): Promise<void> {
    await apiClient.post(`/Ticket/${ticketId}/check-in`);
  }

  /**
   * Download ticket as PDF
   */
  async downloadTicket(ticketId: string): Promise<Blob> {
    const response = await apiClient.get(`/Ticket/${ticketId}/download`, {
      responseType: "blob",
    });
    return response.data;
  }
}

export const ticketService = new TicketService();
