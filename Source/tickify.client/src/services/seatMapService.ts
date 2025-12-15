import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface SeatDto {
  id: number;
  ticketTypeId: number;
  seatZoneId: number | null;
  row: string;
  seatNumber: string;
  fullSeatCode: string;
  gridRow: number | null;
  gridColumn: number | null;
  status: string;
  isBlocked: boolean;
  blockedReason?: string;
  isWheelchair: boolean;
  isReserved: boolean;
  reservedByUserId?: number;
  reservedUntil?: string;
  price: number;
  zoneName?: string;
  zoneColor?: string;
}

export interface SeatZoneDto {
  id: number;
  seatMapId: number;
  ticketTypeId: number;
  name: string;
  color: string | null;
  description?: string;
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  zonePrice: number;
  capacity: number;
  availableSeats: number;
  isActive: boolean;
}

export interface SeatMapDto {
  id: number;
  eventId: number;
  name: string;
  description?: string;
  layoutConfig: string;
  totalRows: number;
  totalColumns: number;
  isActive: boolean;
  createdAt: string;
  zones: SeatZoneDto[];
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
   * Get event seats for customer booking
   */
  async getEventSeats(eventId: string): Promise<SeatDto[]> {
    const response = await apiClient.get<SeatDto[]>(
      `/seatmaps/event/${eventId}/seats`
    );
    return response.data;
  }

  /**
   * Get all seat maps for an organizer
   */
  async getOrganizerSeatMaps(organizerId: number): Promise<SeatMapDto[]> {
    const response = await apiClient.get<SeatMapDto[]>(
      `/seatmaps/organizer/${organizerId}`
    );
    return response.data;
  }

  /**
   * Get seat map templates (not assigned to any event)
   */
  async getSeatMapTemplates(): Promise<SeatMapDto[]> {
    const response = await apiClient.get<SeatMapDto[]>("/seatmaps/templates");
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
   * Reserve seats during checkout
   */
  async reserveSeats(
    seatMapId: number,
    seatIds: number[]
  ): Promise<{ message: string; expiresIn: number }> {
    const response = await apiClient.post<{
      message: string;
      expiresIn: number;
    }>(`/seatmaps/${seatMapId}/reserve`, seatIds);
    return response.data;
  }

  /**
   * Release seats (Organizer/Admin only)
   */
  async releaseSeats(seatMapId: number, seatIds: number[]): Promise<void> {
    await apiClient.post(`/seatmaps/${seatMapId}/release`, seatIds);
  }
}

export const seatMapService = new SeatMapService();
