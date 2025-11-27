import apiClient from "./apiClient";

// ===== INTERFACES =====

/**
 * DTO for creating a new booking
 */
export interface CreateBookingDto {
  eventId: number;
  ticketTypeId: number;
  quantity: number;
  seatIds?: number[];
  promoCode?: string;
}

/**
 * Booking confirmation response after creating booking
 */
export interface BookingConfirmationDto {
  bookingId: number;
  bookingNumber: string;
  eventTitle: string;
  eventStartDate: string;
  eventVenue: string;
  quantity: number;
  totalPrice: number;
  ticketNumbers: string[];
  paymentStatus: string;
  message: string;
}

/**
 * Detailed booking information
 */
export interface BookingDetailDto {
  bookingId: number;
  bookingNumber: string;
  userId: number;
  userName: string;
  userEmail: string;
  eventId: number;
  eventTitle: string;
  eventVenue: string;
  eventStartDate: string;
  quantity: number;
  subTotal: number;
  discount: number;
  totalPrice: number;
  status: string;
  promoCode?: string;
  tickets: BookingTicketDto[];
  bookingDate: string;
  cancelledAt?: string;
}

/**
 * Ticket information within a booking
 */
export interface BookingTicketDto {
  ticketId: number;
  ticketNumber: string;
  ticketTypeName: string;
  price: number;
  seatNumber?: string;
  status: string;
}

/**
 * Booking list item (simplified)
 */
export interface BookingListDto {
  bookingId: number;
  bookingNumber: string;
  eventTitle: string;
  eventDate: string;
  quantity: number;
  totalAmount: number;
  status: string;
  bookingDate: string;
}

/**
 * DTO for cancelling a booking
 */
export interface CancelBookingDto {
  reason?: string;
}

/**
 * DTO for applying promo code
 */
export interface ApplyPromoCodeDto {
  code: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// ===== BOOKING SERVICE =====
class BookingService {
  /**
   * POST /api/bookings - Create a new booking
   */
  async createBooking(
    data: CreateBookingDto
  ): Promise<BookingConfirmationDto> {
    const response = await apiClient.post<ApiResponse<BookingConfirmationDto>>(
      "/bookings",
      data
    );
    return response.data.data;
  }

  /**
   * GET /api/bookings/{id} - Get booking details by ID
   */
  async getBookingById(bookingId: number): Promise<BookingDetailDto> {
    const response = await apiClient.get<ApiResponse<BookingDetailDto>>(
      `/bookings/${bookingId}`
    );
    return response.data.data;
  }

  /**
   * GET /api/bookings/my-bookings - Get all bookings for current user
   */
  async getMyBookings(
    status?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<BookingListDto[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const response = await apiClient.get<ApiResponse<BookingListDto[]>>(
      `/bookings/my-bookings${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data.data;
  }

  /**
   * POST /api/bookings/{id}/cancel - Cancel a booking
   */
  async cancelBooking(
    bookingId: number,
    cancelData: CancelBookingDto
  ): Promise<BookingDetailDto> {
    const response = await apiClient.post<ApiResponse<BookingDetailDto>>(
      `/bookings/${bookingId}/cancel`,
      cancelData
    );
    return response.data.data;
  }

  /**
   * GET /api/bookings/{id}/tickets - Get tickets for a confirmed booking
   */
  async getBookingTickets(bookingId: number): Promise<BookingTicketDto[]> {
    const response = await apiClient.get<ApiResponse<BookingTicketDto[]>>(
      `/bookings/${bookingId}/tickets`
    );
    return response.data.data;
  }

  /**
   * PUT /api/bookings/{id}/apply-promo - Apply promo code to booking
   */
  async applyPromoCode(
    bookingId: number,
    promoCode: string
  ): Promise<BookingDetailDto> {
    const response = await apiClient.put<ApiResponse<BookingDetailDto>>(
      `/bookings/${bookingId}/apply-promo`,
      { code: promoCode }
    );
    return response.data.data;
  }

  /**
   * Helper: Check if booking status is pending
   */
  isBookingPending(booking: BookingDetailDto | BookingListDto): boolean {
    return booking.status.toLowerCase() === "pending";
  }

  /**
   * Helper: Check if booking is confirmed
   */
  isBookingConfirmed(booking: BookingDetailDto | BookingListDto): boolean {
    return booking.status.toLowerCase() === "confirmed";
  }

  /**
   * Helper: Check if booking is cancelled
   */
  isBookingCancelled(booking: BookingDetailDto | BookingListDto): boolean {
    return booking.status.toLowerCase() === "cancelled";
  }

  /**
   * Helper: Format booking status for display
   */
  getStatusLabel(status: string): string {
    switch (status.toLowerCase()) {
      case "pending":
        return "Đang chờ thanh toán";
      case "confirmed":
        return "Đã xác nhận";
      case "cancelled":
        return "Đã hủy";
      case "refunded":
        return "Đã hoàn tiền";
      case "expired":
        return "Đã hết hạn";
      default:
        return status;
    }
  }

  /**
   * Helper: Get status color for display
   */
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "pending":
        return "orange";
      case "confirmed":
        return "green";
      case "cancelled":
        return "red";
      case "refunded":
        return "blue";
      case "expired":
        return "gray";
      default:
        return "gray";
    }
  }
}

export const bookingService = new BookingService();
