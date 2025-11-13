import { apiClient } from "./apiClient";

export interface TicketDetailDto {
  id: number;
  bookingId: number;
  ticketCode: string;
  qrCode: string;
  eventName: string;
  eventDate: string;
  venueName: string;
  seatNumber?: string;
  ticketTypeName: string;
  price: number;
  status: string;
  createdAt: string;
}

export interface TransferTicketDto {
  recipientEmail: string;
  message?: string;
}

export interface TicketTransferDto {
  id: number;
  ticketId: number;
  fromUserId: number;
  toUserEmail: string;
  status: string;
  transferredAt: string;
}

const ticketService = {
  /**
   * Get ticket by ID
   * GET /api/ticket/{id}
   */
  getTicketById: async (id: number): Promise<TicketDetailDto> => {
    const response = await apiClient.get<TicketDetailDto>(`/ticket/${id}`);
    return response.data;
  },

  /**
   * Get current user's tickets
   * GET /api/ticket/my-tickets
   */
  getMyTickets: async (): Promise<TicketDetailDto[]> => {
    const response = await apiClient.get<TicketDetailDto[]>(
      "/ticket/my-tickets"
    );
    return response.data;
  },

  /**
   * Transfer ticket to another user
   * POST /api/ticket/{id}/transfer
   */
  transferTicket: async (
    ticketId: number,
    data: TransferTicketDto
  ): Promise<TicketTransferDto> => {
    const response = await apiClient.post<TicketTransferDto>(
      `/ticket/${ticketId}/transfer`,
      data
    );
    return response.data;
  },

  /**
   * Accept ticket transfer
   * POST /api/ticket/transfers/{id}/accept
   */
  acceptTransfer: async (transferId: number): Promise<void> => {
    await apiClient.post(`/ticket/transfers/${transferId}/accept`);
  },

  /**
   * Reject ticket transfer
   * POST /api/ticket/transfers/{id}/reject
   */
  rejectTransfer: async (transferId: number): Promise<void> => {
    await apiClient.post(`/ticket/transfers/${transferId}/reject`);
  },

  /**
   * Get QR code for ticket
   * GET /api/ticket/{id}/qrcode
   */
  getTicketQRCode: async (ticketId: number): Promise<string> => {
    const response = await apiClient.get<string>(`/ticket/${ticketId}/qrcode`);
    return response.data;
  },

  /**
   * Resend ticket email
   * POST /api/ticket/{id}/resend-email
   */
  resendTicketEmail: async (ticketId: number): Promise<void> => {
    await apiClient.post(`/ticket/${ticketId}/resend-email`);
  },

  /**
   * Get all tickets for an event (Organizer only)
   * GET /api/ticket/event/{eventId}
   */
  getEventTickets: async (eventId: number): Promise<TicketDetailDto[]> => {
    const response = await apiClient.get<TicketDetailDto[]>(
      `/ticket/event/${eventId}`
    );
    return response.data;
  },
};

export default ticketService;
