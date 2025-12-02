import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingService } from '../../services/bookingService';
import apiClient from '../../services/apiClient';

// Mock dependencies
vi.mock('../../services/apiClient');

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create booking successfully', async () => {
      // Arrange
      const createDto = {
        eventId: 1,
        ticketTypeId: 1,
        quantity: 2,
        seatIds: [1, 2],
        promoCode: 'PROMO10',
      };

      const mockConfirmation = {
        bookingId: 1,
        bookingNumber: 'BK001',
        eventTitle: 'Test Event',
        eventStartDate: '2024-12-01T10:00:00Z',
        eventVenue: 'Test Venue',
        quantity: 2,
        totalPrice: 210,
        ticketNumbers: ['T001', 'T002'],
        paymentStatus: 'Pending',
        message: 'Booking created successfully',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockConfirmation,
      } as any);

      // Act
      const result = await bookingService.createBooking(createDto);

      // Assert
      expect(result).toEqual(mockConfirmation);
      expect(apiClient.post).toHaveBeenCalledWith('/bookings', createDto);
    });
  });

  describe('getBookingById', () => {
    it('should return booking by ID', async () => {
      // Arrange
      const bookingId = 1;
      const mockBooking = {
        bookingId: 1,
        userId: 1,
        eventId: 1,
        ticketTypeId: 1,
        quantity: 2,
        totalAmount: 200,
        discountAmount: 0,
        finalAmount: 210,
        status: 'Confirmed',
        bookingDate: '2024-01-01T00:00:00Z',
        paymentStatus: 'Paid',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockBooking,
      } as any);

      // Act
      const result = await bookingService.getBookingById(bookingId);

      // Assert
      expect(result).toEqual(mockBooking);
      expect(apiClient.get).toHaveBeenCalledWith(`/bookings/${bookingId}`);
    });
  });

  describe('getUserBookings', () => {
    it('should return user bookings', async () => {
      // Arrange
      const mockBookings = [
        {
          bookingId: 1,
          userId: 1,
          eventId: 1,
          ticketTypeId: 1,
          quantity: 2,
          totalAmount: 200,
          discountAmount: 0,
          finalAmount: 210,
          status: 'Confirmed',
          bookingDate: '2024-01-01T00:00:00Z',
          paymentStatus: 'Paid',
        },
        {
          bookingId: 2,
          userId: 1,
          eventId: 2,
          ticketTypeId: 2,
          quantity: 1,
          totalAmount: 100,
          discountAmount: 10,
          finalAmount: 105,
          status: 'Pending',
          bookingDate: '2024-01-02T00:00:00Z',
          paymentStatus: 'Pending',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockBookings,
      } as any);

      // Act
      const result = await bookingService.getUserBookings();

      // Assert
      expect(result).toEqual(mockBookings);
      expect(apiClient.get).toHaveBeenCalledWith('/bookings/my-bookings');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      // Arrange
      const bookingId = 1;
      vi.mocked(apiClient.post).mockResolvedValue({} as any);

      // Act
      await bookingService.cancelBooking(bookingId);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith(`/bookings/${bookingId}/cancel`);
    });
  });
});

