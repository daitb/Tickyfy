import { apiClient } from "./apiClient";

export interface SeatDto {
  id: number;
  row: string;
  seatNumber: string;
  gridRow?: number;
  gridColumn?: number;
  status: "Available" | "Selected" | "Sold" | "Blocked" | "Reserved";
  price: number;
  seatZoneId?: number;
}

export interface SeatZoneDto {
  id: number;
  name: string;
  color?: string;
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
  layoutConfig: string; // JSON string
  totalRows: number;
  totalColumns: number;
  isActive: boolean;
  zones: SeatZoneDto[];
  seats: SeatDto[];
}

export interface CreateSeatMapDto {
  eventId: number;
  name: string;
  description?: string;
  layoutConfig: string;
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
  seatIds: number[];
}

const seatMapService = {
  /**
   * Get seat map by ID
   * GET /api/seatmaps/{id}
   */
  getSeatMapById: async (id: number): Promise<SeatMapDto> => {
    const response = await apiClient.get<SeatMapDto>(`/seatmaps/${id}`);
    return response.data;
  },

  /**
   * Get seat map by event ID
   * GET /api/seatmaps/event/{eventId}
   */
  getSeatMapByEvent: async (eventId: number): Promise<SeatMapDto> => {
    const response = await apiClient.get<SeatMapDto>(
      `/seatmaps/event/${eventId}`
    );
    return response.data;
  },

  /**
   * Create seat map (Organizer/Admin)
   * POST /api/seatmaps
   */
  createSeatMap: async (data: CreateSeatMapDto): Promise<SeatMapDto> => {
    const response = await apiClient.post<SeatMapDto>("/seatmaps", data);
    return response.data;
  },

  /**
   * Update seat map (Organizer/Admin)
   * PUT /api/seatmaps/{id}
   */
  updateSeatMap: async (
    id: number,
    data: UpdateSeatMapDto
  ): Promise<SeatMapDto> => {
    const response = await apiClient.put<SeatMapDto>(`/seatmaps/${id}`, data);
    return response.data;
  },

  /**
   * Delete seat map (Organizer/Admin)
   * DELETE /api/seatmaps/{id}
   */
  deleteSeatMap: async (id: number): Promise<void> => {
    await apiClient.delete(`/seatmaps/${id}`);
  },

  /**
   * Reserve seats
   * POST /api/seatmaps/{seatMapId}/reserve
   */
  reserveSeats: async (seatMapId: number, seatIds: number[]): Promise<void> => {
    await apiClient.post(`/seatmaps/${seatMapId}/reserve`, seatIds);
  },

  /**
   * Release reserved seats
   * POST /api/seatmaps/{seatMapId}/release
   */
  releaseSeats: async (seatMapId: number, seatIds: number[]): Promise<void> => {
    await apiClient.post(`/seatmaps/${seatMapId}/release`, seatIds);
  },
};

export default seatMapService;
