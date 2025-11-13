import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface CreateBookingDto {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  seatIds?: string[];
  promoCode?: string;
}

export interface BookingDto {
  bookingId: string;
  userId: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  bookingDate: string;
  paymentStatus: string;
  event?: any;
  tickets?: any[];
}

// ===== BOOKING SERVICE =====
class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingDto): Promise<BookingDto> {
    const response = await apiClient.post<BookingDto>("/Booking", data);
    return response.data;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string): Promise<BookingDto> {
    const response = await apiClient.get<BookingDto>(`/Booking/${bookingId}`);
    return response.data;
  }

  /**
   * Get all bookings for current user
   */
  async getUserBookings(): Promise<BookingDto[]> {
    const response = await apiClient.get<BookingDto[]>("/Booking/user");
    return response.data;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<void> {
    await apiClient.post(`/Booking/${bookingId}/cancel`);
  }
}

export const bookingService = new BookingService();
