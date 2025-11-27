import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { SeatDto } from "../services/seatService";

/**
 * Booking flow state
 */
export interface BookingState {
  // Event information
  eventId: number | null;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventImage?: string;

  // Ticket type selection
  ticketTypeId: number | null;
  ticketTypeName: string;
  ticketTypePrice: number;

  // Seat selection
  selectedSeats: SeatDto[];
  quantity: number;

  // Pricing
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;

  // Promo code
  promoCode?: string;

  // Booking result
  bookingId?: number;
  bookingNumber?: string;
}

/**
 * Booking context actions
 */
interface BookingContextType {
  bookingState: BookingState;

  // Event selection
  setEventInfo: (
    eventId: number,
    title: string,
    date: string,
    venue: string,
    image?: string
  ) => void;

  // Ticket type selection
  setTicketType: (ticketTypeId: number, name: string, price: number) => void;

  // Seat selection
  addSeat: (seat: SeatDto) => void;
  removeSeat: (seatId: number) => void;
  setSeats: (seats: SeatDto[]) => void;
  clearSeats: () => void;

  // Pricing
  updatePricing: (
    subtotal: number,
    serviceFee: number,
    discount?: number
  ) => void;

  // Promo code
  setPromoCode: (code: string) => void;

  // Booking result
  setBookingResult: (bookingId: number, bookingNumber: string) => void;

  // Reset
  resetBooking: () => void;
}

const initialState: BookingState = {
  eventId: null,
  eventTitle: "",
  eventDate: "",
  eventVenue: "",
  eventImage: undefined,
  ticketTypeId: null,
  ticketTypeName: "",
  ticketTypePrice: 0,
  selectedSeats: [],
  quantity: 0,
  subtotal: 0,
  serviceFee: 0,
  discount: 0,
  total: 0,
  promoCode: undefined,
  bookingId: undefined,
  bookingNumber: undefined,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

/**
 * Booking Provider Component
 */
export const BookingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [bookingState, setBookingState] = useState<BookingState>(initialState);

  const setEventInfo = (
    eventId: number,
    title: string,
    date: string,
    venue: string,
    image?: string
  ) => {
    setBookingState((prev) => ({
      ...prev,
      eventId,
      eventTitle: title,
      eventDate: date,
      eventVenue: venue,
      eventImage: image,
    }));
  };

  const setTicketType = (ticketTypeId: number, name: string, price: number) => {
    setBookingState((prev) => ({
      ...prev,
      ticketTypeId,
      ticketTypeName: name,
      ticketTypePrice: price,
    }));
  };

  const addSeat = (seat: SeatDto) => {
    setBookingState((prev) => {
      const exists = prev.selectedSeats.some((s) => s.id === seat.id);
      if (exists) return prev;

      const newSeats = [...prev.selectedSeats, seat];
      const newQuantity = newSeats.length;
      const newSubtotal = newSeats.reduce(
        (sum, s) => sum + (s.ticketTypePrice || prev.ticketTypePrice),
        0
      );
      const newServiceFee = newSubtotal * 0.05;
      const newTotal = newSubtotal + newServiceFee - prev.discount;

      return {
        ...prev,
        selectedSeats: newSeats,
        quantity: newQuantity,
        subtotal: newSubtotal,
        serviceFee: newServiceFee,
        total: newTotal,
      };
    });
  };

  const removeSeat = (seatId: number) => {
    setBookingState((prev) => {
      const newSeats = prev.selectedSeats.filter((s) => s.id !== seatId);
      const newQuantity = newSeats.length;
      const newSubtotal = newSeats.reduce(
        (sum, s) => sum + (s.ticketTypePrice || prev.ticketTypePrice),
        0
      );
      const newServiceFee = newSubtotal * 0.05;
      const newTotal = newSubtotal + newServiceFee - prev.discount;

      return {
        ...prev,
        selectedSeats: newSeats,
        quantity: newQuantity,
        subtotal: newSubtotal,
        serviceFee: newServiceFee,
        total: newTotal,
      };
    });
  };

  const setSeats = (seats: SeatDto[]) => {
    setBookingState((prev) => {
      const newQuantity = seats.length;
      const newSubtotal = seats.reduce(
        (sum, s) => sum + (s.ticketTypePrice || prev.ticketTypePrice),
        0
      );
      const newServiceFee = newSubtotal * 0.05;
      const newTotal = newSubtotal + newServiceFee - prev.discount;

      return {
        ...prev,
        selectedSeats: seats,
        quantity: newQuantity,
        subtotal: newSubtotal,
        serviceFee: newServiceFee,
        total: newTotal,
      };
    });
  };

  const clearSeats = () => {
    setBookingState((prev) => ({
      ...prev,
      selectedSeats: [],
      quantity: 0,
      subtotal: 0,
      serviceFee: 0,
      total: 0,
    }));
  };

  const updatePricing = (
    subtotal: number,
    serviceFee: number,
    discount: number = 0
  ) => {
    setBookingState((prev) => ({
      ...prev,
      subtotal,
      serviceFee,
      discount,
      total: subtotal + serviceFee - discount,
    }));
  };

  const setPromoCode = (code: string) => {
    setBookingState((prev) => ({
      ...prev,
      promoCode: code,
    }));
  };

  const setBookingResult = (bookingId: number, bookingNumber: string) => {
    setBookingState((prev) => ({
      ...prev,
      bookingId,
      bookingNumber,
    }));
  };

  const resetBooking = () => {
    setBookingState(initialState);
  };

  return (
    <BookingContext.Provider
      value={{
        bookingState,
        setEventInfo,
        setTicketType,
        addSeat,
        removeSeat,
        setSeats,
        clearSeats,
        updatePricing,
        setPromoCode,
        setBookingResult,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

/**
 * Hook to use booking context
 */
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
};
