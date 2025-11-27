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
  seatNumber?: string;
  status: string;
  qrCode?: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
}

export interface TransferTicketDto {
  recipientEmail: string;
  recipientName?: string;
  message?: string;
}

export interface AcceptTransferDto {
  transferId: number;
  acceptanceToken: string;
}

export interface TicketTransferResponseDto {
  id: number;
  ticketId: number;
  ticketCode: string;
  fromUserId: number;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: number;
  toUserName: string;
  toUserEmail: string;
  transferredAt: string;
  reason?: string;
  isApproved: boolean;
  acceptanceExpiresAt?: string;
}

export interface TicketScanDto {
  ticketNumber: string;
  eventId: number;
  scannedByUserId?: number;
  scanLocation?: string;
  scanType?: string;
  deviceId?: string;
  notes?: string;
}

export interface TicketStatsDto {
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  cancelledTickets: number;
}

export interface QRCodeResponse {
  ticketId: number;
  ticketNumber: string;
  qrCodeData: string;
  qrCodeImage: string;
  format: string;
  encoding: string;
}

// ===== TICKET SERVICE =====
class TicketService {
  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: number): Promise<TicketDto> {
    const response = await apiClient.get<TicketDto>(`/tickets/${ticketId}`);
    return response.data;
  }

  /**
   * Get all tickets for current user with optional filters
   */
  async getMyTickets(
    status?: string,
    eventId?: number
  ): Promise<TicketDto[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (eventId) params.append("eventId", eventId.toString());

    const response = await apiClient.get<TicketDto[]>(
      `/tickets/my-tickets${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
  }

  /**
   * Get ticket statistics for current user
   */
  async getMyTicketsStats(): Promise<TicketStatsDto> {
    const response = await apiClient.get<TicketStatsDto>(
      "/tickets/my-tickets/stats"
    );
    return response.data;
  }

  /**
   * Transfer ticket to another user
   */
  async transferTicket(
    ticketId: number,
    data: TransferTicketDto
  ): Promise<TicketDto> {
    const response = await apiClient.post<TicketDto>(
      `/tickets/${ticketId}/transfer`,
      data
    );
    return response.data;
  }

  /**
   * Get pending transfer requests for current user
   */
  async getPendingTransfers(): Promise<TicketTransferResponseDto[]> {
    const response = await apiClient.get<TicketTransferResponseDto[]>(
      "/tickets/transfers/pending"
    );
    return response.data;
  }

  /**
   * Accept ticket transfer (with token from email)
   */
  async acceptTransferByToken(
    transferId: number,
    token: string
  ): Promise<TicketDto> {
    const response = await apiClient.get<TicketDto>(
      `/tickets/transfers/accept?transferId=${transferId}&token=${token}`
    );
    return response.data;
  }

  /**
   * Accept ticket transfer (POST with body)
   */
  async acceptTransfer(data: AcceptTransferDto): Promise<TicketDto> {
    const response = await apiClient.post<TicketDto>(
      `/tickets/transfers/${data.transferId}/accept`,
      data
    );
    return response.data;
  }

  /**
   * Reject ticket transfer (with token from email)
   */
  async rejectTransferByToken(
    transferId: number,
    token: string
  ): Promise<{ rejected: boolean; message: string }> {
    const response = await apiClient.get<{
      rejected: boolean;
      message: string;
    }>(`/tickets/transfers/reject?transferId=${transferId}&token=${token}`);
    return response.data;
  }

  /**
   * Reject ticket transfer (POST with body)
   */
  async rejectTransfer(
    data: AcceptTransferDto
  ): Promise<{ rejected: boolean; message: string }> {
    const response = await apiClient.post<{
      rejected: boolean;
      message: string;
    }>(`/tickets/transfers/${data.transferId}/reject`, data);
    return response.data;
  }

  /**
   * Get QR code for ticket
   */
  async getQRCode(ticketId: number): Promise<QRCodeResponse> {
    const response = await apiClient.get<QRCodeResponse>(
      `/tickets/${ticketId}/qrcode`
    );
    return response.data;
  }

  /**
   * Resend ticket email
   */
  async resendEmail(ticketId: number): Promise<{ emailSent: boolean }> {
    const response = await apiClient.post<{ emailSent: boolean }>(
      `/tickets/${ticketId}/resend-email`
    );
    return response.data;
  }

  /**
   * Scan/validate ticket (for organizers/staff)
   */
  async scanTicket(scanData: TicketScanDto): Promise<TicketDto> {
    const response = await apiClient.post<TicketDto>(
      "/tickets/scan",
      scanData
    );
    return response.data;
  }

  /**
   * Validate ticket by code and event (for checking validity)
   */
  async validateTicket(
    ticketCode: string,
    eventId: number
  ): Promise<{ isValid: boolean }> {
    const response = await apiClient.get<{ isValid: boolean }>(
      `/tickets/validate?ticketCode=${ticketCode}&eventId=${eventId}`
    );
    return response.data;
  }

  /**
   * Get all tickets for an event (Admin/Organizer only)
   */
  async getEventTickets(
    eventId: number,
    status?: string
  ): Promise<TicketDto[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const response = await apiClient.get<TicketDto[]>(
      `/tickets/event/${eventId}${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
  }

  /**
   * Download ticket as PDF
   */
  async downloadTicket(ticketId: number): Promise<Blob> {
    const response = await apiClient.get(`/tickets/${ticketId}/download`, {
      responseType: "blob",
    });
    return response.data;
  }

  /**
   * Helper: Download QR code as image
   */
  async downloadQRCode(ticketId: number, filename?: string): Promise<void> {
    const qrData = await this.getQRCode(ticketId);

    // Convert base64 to blob
    const base64Data = qrData.qrCodeImage.split(",")[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/png" });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `ticket-${qrData.ticketNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const ticketService = new TicketService();
