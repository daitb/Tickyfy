import { apiClient } from "./apiClient";

export interface CreateBookingDto {
  eventId: number;
  ticketTypeId: number;
  quantity: number;
  seatIds?: number[];
  promoCode?: string;
}

export interface BookingDto {
  id: number;
  userId: number;
  eventId: number;
  bookingCode: string;
  totalAmount: number;
  status: string;
  bookingDate: string;
  expiresAt?: string;
}

export interface BookingDetailDto extends BookingDto {
  eventName: string;
  eventDate: string;
  venueName: string;
  tickets: TicketDto[];
}

export interface TicketDto {
  id: number;
  bookingId: number;
  ticketCode: string;
  seatNumber?: string;
  price: number;
  status: string;
}

export interface BookingListDto {
  id: number;
  bookingCode: string;
  eventName: string;
  eventDate: string;
  totalAmount: number;
  status: string;
  bookingDate: string;
}

export interface BookingConfirmationDto {
  bookingId: number;
  bookingCode: string;
  totalAmount: number;
  expiresAt: string;
  message: string;
}

export interface CancelBookingDto {
  reason: string;
}

const bookingService = {
  /**
   * Create a new booking
   * POST /api/booking
   */
  createBooking: async (
    data: CreateBookingDto
  ): Promise<BookingConfirmationDto> => {
    const response = await apiClient.post<BookingConfirmationDto>(
      "/booking",
      data
    );
    return response.data;
  },

  /**
   * Get booking by ID
   * GET /api/booking/{id}
   */
  getBookingById: async (id: number): Promise<BookingDto> => {
    const response = await apiClient.get<BookingDto>(`/booking/${id}`);
    return response.data;
  },

  /**
   * Get booking details with tickets
   * GET /api/booking/{id}
   */
  getBookingDetails: async (id: number): Promise<BookingDetailDto> => {
    const response = await apiClient.get<BookingDetailDto>(`/booking/${id}`);
    return response.data;
  },

  /**
   * Get current user's bookings
   * GET /api/booking/my-bookings
   */
  getMyBookings: async (params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<BookingListDto[]> => {
    const response = await apiClient.get<BookingListDto[]>(
      "/booking/my-bookings",
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Cancel a booking
   * POST /api/booking/{id}/cancel
   */
  cancelBooking: async (
    id: number,
    data: CancelBookingDto
  ): Promise<BookingDto> => {
    const response = await apiClient.post<BookingDto>(
      `/booking/${id}/cancel`,
      data
    );
    return response.data;
  },

  /**
   * Get tickets for a booking
   * GET /api/booking/{id}/tickets
   */
  getBookingTickets: async (id: number): Promise<TicketDto[]> => {
    const response = await apiClient.get<TicketDto[]>(`/booking/${id}/tickets`);
    return response.data;
  },

  /**
   * Apply promo code to booking
   * PUT /api/booking/{id}/apply-promo
   */
  applyPromoCode: async (id: number, code: string): Promise<BookingDto> => {
    const response = await apiClient.put<BookingDto>(
      `/booking/${id}/apply-promo`,
      {
        code,
      }
    );
    return response.data;
  },
};

export default bookingService;
