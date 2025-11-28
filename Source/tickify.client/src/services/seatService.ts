import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface SeatDto {
  id: number;
  ticketTypeId: number;
  seatZoneId?: number;
  row: string;
  seatNumber: string;
  fullSeatCode: string;
  gridRow?: number;
  gridColumn?: number;
  status: "Available" | "Selected" | "Sold" | "Blocked" | "Reserved";
  isBlocked: boolean;
  blockedReason?: string;
  reservedByUserId?: number;
  reservedUntil?: string;
  ticketTypeName?: string;
  ticketTypePrice?: number;
  zoneName?: string;
}

export interface SeatAvailabilityDto {
  ticketTypeId: number;
  ticketTypeName: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  reservedSeats: number;
  soldSeats: number;
  seats: SeatDto[];
}

export interface BulkCreateSeatDto {
  ticketTypeId: number;
  seatZoneId?: number;
  seats: SeatItem[];
}

export interface SeatItem {
  row: string;
  seatNumber: string;
  gridRow?: number;
  gridColumn?: number;
}

export interface BlockSeatDto {
  reason?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// ===== SEAT SERVICE =====
class SeatService {
  /**
   * GET /api/seats/event/{eventId} - Get all seats for an event
   */
  async getSeatsByEvent(eventId: number): Promise<SeatDto[]> {
    const response = await apiClient.get<ApiResponse<SeatDto[]>>(
      `/seats/event/${eventId}`
    );
    return response.data.data;
  }

  /**
   * GET /api/seats/ticket-type/{ticketTypeId} - Get seat availability by ticket type
   */
  async getSeatAvailabilityByTicketType(
    ticketTypeId: number
  ): Promise<SeatAvailabilityDto> {
    const response = await apiClient.get<ApiResponse<SeatAvailabilityDto>>(
      `/seats/ticket-type/${ticketTypeId}`
    );
    return response.data.data;
  }

  /**
   * POST /api/seats/bulk-create - Create multiple seats (Organizer/Admin)
   */
  async bulkCreateSeats(data: BulkCreateSeatDto): Promise<SeatDto[]> {
    const response = await apiClient.post<ApiResponse<SeatDto[]>>(
      "/seats/bulk-create",
      data
    );
    return response.data.data;
  }

  /**
   * PUT /api/seats/{id}/block - Block a seat (Admin)
   */
  async blockSeat(seatId: number, data: BlockSeatDto): Promise<SeatDto> {
    const response = await apiClient.put<ApiResponse<SeatDto>>(
      `/seats/${seatId}/block`,
      data
    );
    return response.data.data;
  }

  /**
   * PUT /api/seats/{id}/unblock - Unblock a seat (Admin)
   */
  async unblockSeat(seatId: number): Promise<SeatDto> {
    const response = await apiClient.put<ApiResponse<SeatDto>>(
      `/seats/${seatId}/unblock`
    );
    return response.data.data;
  }

  /**
   * GET /api/seats/{id} - Get single seat details
   */
  async getSeatById(seatId: number): Promise<SeatDto> {
    const response = await apiClient.get<ApiResponse<SeatDto>>(
      `/seats/${seatId}`
    );
    return response.data.data;
  }

  /**
   * POST /api/seats/check-availability - Check if specific seats are available
   */
  async checkSeatAvailability(seatIds: number[]): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>(
      "/seats/check-availability",
      seatIds
    );
    return response.data.data;
  }

  /**
   * Helper: Group seats by row for display
   */
  groupSeatsByRow(seats: SeatDto[]): Map<string, SeatDto[]> {
    const grouped = new Map<string, SeatDto[]>();
    seats.forEach((seat) => {
      if (!grouped.has(seat.row)) {
        grouped.set(seat.row, []);
      }
      grouped.get(seat.row)!.push(seat);
    });
    // Sort seats in each row by seat number
    grouped.forEach((rowSeats) => {
      rowSeats.sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber));
    });
    return grouped;
  }

  /**
   * Helper: Group seats by ticket type
   */
  groupSeatsByTicketType(seats: SeatDto[]): Map<number, SeatDto[]> {
    const grouped = new Map<number, SeatDto[]>();
    seats.forEach((seat) => {
      if (!grouped.has(seat.ticketTypeId)) {
        grouped.set(seat.ticketTypeId, []);
      }
      grouped.get(seat.ticketTypeId)!.push(seat);
    });
    return grouped;
  }
}

export const seatService = new SeatService();
