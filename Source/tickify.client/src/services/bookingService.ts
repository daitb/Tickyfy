import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface CreateBookingDto {
  eventId: number;
  ticketTypeId: number;
  quantity: number;
  seatIds?: number[];
  promoCode?: string;
}

export interface BookingDto {
  bookingId: number;
  userId: number;
  eventId: number;
  ticketTypeId: number;
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

// ===== BOOKING SERVICE =====
class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingDto): Promise<BookingConfirmationDto> {
    const response = await apiClient.post<BookingConfirmationDto>("/bookings", data);
    return response.data; // apiClient interceptor already unwrapped .data.data
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: number): Promise<BookingDto> {
    const response = await apiClient.get<BookingDto>(`/bookings/${bookingId}`);
    return response.data;
  }

  /**
   * Get all bookings for current user
   */
  async getUserBookings(): Promise<BookingDto[]> {
    const response = await apiClient.get<BookingDto[]>("/bookings/my-bookings");
    return response.data;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: number): Promise<void> {
    await apiClient.post(`/bookings/${bookingId}/cancel`);
  }
}

export const bookingService = new BookingService();
