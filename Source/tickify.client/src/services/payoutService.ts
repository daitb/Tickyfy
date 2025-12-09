import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface PayoutDto {
  payoutId: number;
  organizerId: number;
  organizerName: string;
  amount: number;
  status: string;
  transactionId?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface RequestPayoutDto {
  eventId: number;
  amount: number;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
}

export interface ApprovePayoutDto {
  notes?: string;
  transactionId?: string;
}

export interface RejectPayoutDto {
  reason: string;
  notes?: string;
}

export interface PayoutStatsDto {
  organizerId: number;
  organizerName: string;
  totalRevenue: number;
  totalPlatformFees: number;
  totalEarnings: number;
  pendingPayouts: number;
  approvedPayouts: number;
  processedPayouts: number;
  totalPayoutRequests: number;
  pendingPayoutRequests: number;
}

// ===== PAYOUT SERVICE =====
class PayoutService {
  /**
   * Get all payouts (Organizer sees their own, Admin sees all)
   */
  async getAllPayouts(): Promise<PayoutDto[]> {
    const response = await apiClient.get<PayoutDto[]>("/payouts");
    return response.data;
  }

  /**
   * Get payout by ID
   */
  async getPayoutById(id: number): Promise<PayoutDto> {
    const response = await apiClient.get<PayoutDto>(`/payouts/${id}`);
    return response.data;
  }

  /**
   * Request a payout (Organizer only)
   */
  async requestPayout(data: RequestPayoutDto): Promise<PayoutDto> {
    const response = await apiClient.post<PayoutDto>("/payouts/request", data);
    return response.data;
  }

  /**
   * Approve a payout (Admin only)
   */
  async approvePayout(id: number, data: ApprovePayoutDto): Promise<PayoutDto> {
    const response = await apiClient.post<PayoutDto>(
      `/payouts/${id}/approve`,
      data
    );
    return response.data;
  }

  /**
   * Reject a payout (Admin only)
   */
  async rejectPayout(id: number, data: RejectPayoutDto): Promise<PayoutDto> {
    const response = await apiClient.post<PayoutDto>(
      `/payouts/${id}/reject`,
      data
    );
    return response.data;
  }

  /**
   * Get organizer payout statistics
   */
  async getOrganizerStats(organizerId: number): Promise<PayoutStatsDto> {
    const response = await apiClient.get<PayoutStatsDto>(
      `/payouts/organizer/${organizerId}/stats`
    );
    return response.data;
  }
}

export const payoutService = new PayoutService();

