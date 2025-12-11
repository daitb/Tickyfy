import apiClient from "./apiClient";

// ===== ORGANIZER DTOs =====
export interface CreateOrganizerDto {
  companyName: string;
  businessRegistrationNumber?: string;
  taxCode?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  website?: string;
  description?: string;
}

export interface OrganizerDto {
  organizerId: number;
  userId: number;
  companyName: string;
  description?: string;
  website?: string;
  phoneNumber?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface OrganizerProfileDto {
  organizerId: number;
  userId: number;
  companyName: string;
  businessRegistrationNumber?: string;
  taxCode?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  website?: string;
  description?: string;
  isVerified: boolean;
  totalEvents: number;
  totalRevenue: number;
  createdAt: string;
}

export interface OrganizerEventDto {
  eventId: number;
  title: string;
  startDate: string;
  endDate: string;
  bannerImage?: string;
  status: string;
  totalSeats: number;
  soldSeats: number;
  revenue: number;
  rejectionReason?: string;
}

export interface OrganizerEarningsDto {
  totalRevenue: number;
  totalPlatformFee: number;
  netEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  availableBalance: number;
  totalTicketsSold: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    ticketsSold: number;
  }>;
  topEvents: Array<{
    eventId: number;
    title: string;
    revenue: number;
    ticketsSold: number;
  }>;
}

export interface OrganizerBookingDto {
  bookingId: number;
  bookingCode: string;
  bookingDate: string;
  status: string;
  eventId: number;
  eventTitle: string;
  customerName: string;
  customerEmail: string;
  totalTickets: number;
  totalAmount: number;
  paymentStatus?: string;
  paymentDate?: string;
}

// ===== ORGANIZER SERVICE =====
class OrganizerService {
  /**
   * POST /api/organizers/register - Register as organizer (creates request)
   */
  async registerOrganizer(dto: CreateOrganizerDto): Promise<any> {
    const response = await apiClient.post<any>("/organizers/register", dto);
    // Backend returns ApiResponse<object> with data nested in response.data.data
    return response.data?.data || response.data;
  }

  /**
   * GET /api/organizers/{id} - Get organizer profile
   */
  async getOrganizerProfile(id: number): Promise<OrganizerProfileDto> {
    const response = await apiClient.get<OrganizerProfileDto>(
      `/organizers/${id}`
    );
    return response.data;
  }

  /**
   * PUT /api/organizers/{id} - Update organizer profile
   */
  async updateOrganizerProfile(
    id: number,
    dto: CreateOrganizerDto
  ): Promise<OrganizerProfileDto> {
    const response = await apiClient.put<OrganizerProfileDto>(
      `/organizers/${id}`,
      dto
    );
    return response.data;
  }

  /**
   * GET /api/organizers/{id}/events - Get organizer's events
   */
  async getOrganizerEvents(id: number): Promise<OrganizerEventDto[]> {
    const response = await apiClient.get<OrganizerEventDto[]>(
      `/organizers/${id}/events`
    );
    return response.data;
  }

  /**
   * GET /api/organizers/{id}/earnings - Get organizer earnings dashboard
   */
  async getOrganizerEarnings(id: number): Promise<OrganizerEarningsDto> {
    const response = await apiClient.get<OrganizerEarningsDto>(
      `/organizers/${id}/earnings`
    );
    return response.data;
  }

  /**
   * GET /api/organizers/{id}/bookings - Get organizer bookings
   */
  async getOrganizerBookings(id: number): Promise<OrganizerBookingDto[]> {
    const response = await apiClient.get<OrganizerBookingDto[]>(
      `/organizers/${id}/bookings`
    );
    return response.data;
  }

  /**
   * GET /api/organizers - List all organizers (Admin only)
   */
  async getAllOrganizers(): Promise<OrganizerDto[]> {
    const response = await apiClient.get<OrganizerDto[]>("/organizers");
    return response.data;
  }

  /**
   * POST /api/organizers/{id}/verify - Verify organizer (Admin only)
   */
  async verifyOrganizer(id: number): Promise<OrganizerDto> {
    const response = await apiClient.post<OrganizerDto>(
      `/organizers/${id}/verify`
    );
    return response.data;
  }

  /**
   * GET /api/organizers/my-request - Get current user's pending organizer request
   */
  async getMyOrganizerRequest(): Promise<any | null> {
    try {
      const response = await apiClient.get<any>("/organizers/my-request");
      return response.data?.data || null;
    } catch (error: any) {
      // If no request found, return null instead of throwing
      if (error.response?.status === 404 || error.response?.status === 200) {
        return null;
      }
      throw error;
    }
  }
}

export const organizerService = new OrganizerService();
