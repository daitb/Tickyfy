import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface SeatDto {
  seatId: string;
  row: number;
  seatNumber: number;
  gridRow: number;
  gridColumn: number;
  status: "Available" | "Reserved" | "Sold";
  price: number;
  seatZoneId: string;
}

export interface SeatZoneDto {
  seatZoneId: string;
  name: string;
  color: string;
  description?: string;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  zonePrice: number;
  capacity: number;
  availableSeats: number;
  seats: SeatDto[];
}

export interface SeatMapDto {
  seatMapId: string;
  eventId: string;
  name: string;
  layoutConfig?: string;
  totalRows: number;
  totalColumns: number;
  isActive: boolean;
  createdAt: string;
  zones: SeatZoneDto[];
  seats: SeatDto[];
}

export interface CreateSeatMapDto {
  eventId: string;
  name: string;
  description?: string;
  layoutConfig?: string;
  totalRows: number;
  totalColumns: number;
}

export interface UpdateSeatMapDto {
  name?: string;
  description?: string;
  layoutConfig?: string;
  totalRows?: number;
  totalColumns?: number;
  isActive?: boolean;
}

export interface ReserveSeatDto {
  seatIds: string[];
}

// ===== SEAT MAP SERVICE =====
class SeatMapService {
  /**
   * Get seat map by ID
   */
  async getSeatMapById(seatMapId: string): Promise<SeatMapDto> {
    const response = await apiClient.get<SeatMapDto>(`/seatmaps/${seatMapId}`);
    return response.data;
  }

  /**
   * Get seat map by event ID
   */
  async getSeatMapByEvent(eventId: string): Promise<SeatMapDto> {
    const response = await apiClient.get<SeatMapDto>(
      `/seatmaps/event/${eventId}`
    );
    return response.data;
  }

  /**
   * Create a new seat map (Organizer/Admin only)
   */
  async createSeatMap(data: CreateSeatMapDto): Promise<SeatMapDto> {
    const response = await apiClient.post<SeatMapDto>("/seatmaps", data);
    return response.data;
  }

  /**
   * Update seat map (Organizer/Admin only)
   */
  async updateSeatMap(
    seatMapId: string,
    data: UpdateSeatMapDto
  ): Promise<SeatMapDto> {
    const response = await apiClient.put<SeatMapDto>(
      `/seatmaps/${seatMapId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete seat map (Organizer/Admin only)
   */
  async deleteSeatMap(seatMapId: string): Promise<void> {
    await apiClient.delete(`/seatmaps/${seatMapId}`);
  }

  /**
   * Reserve seats
   */
  async reserveSeats(seatMapId: string, seatIds: string[]): Promise<void> {
    await apiClient.post(`/seatmaps/${seatMapId}/reserve`, { seatIds });
  }

  /**
   * Release seats
   */
  async releaseSeats(seatMapId: string, seatIds: string[]): Promise<void> {
    await apiClient.post(`/seatmaps/${seatMapId}/release`, { seatIds });
  }
}

export const seatMapService = new SeatMapService();
