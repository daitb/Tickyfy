import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface ValidatePromoCodeDto {
  code?: string;
  promoCode?: string; // Support both field names for backward compatibility
  eventId: number;
  orderTotal?: number; // Support both field names
  totalAmount?: number; // Support both field names for backward compatibility
}

export interface PromoCodeValidationResult {
  isValid: boolean;
  discountAmount: number;
  message: string;
}

export interface PromoCode {
  promoCodeId: number;
  code: string;
  description?: string;
  eventId?: number;
  organizerId?: number;
  discountPercent?: number;
  discountAmount?: number;
  minimumPurchase?: number;
  maxUses?: number;
  currentUses: number;
  maxUsesPerUser?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  createdAt: string;
  createdByUserId: number;
}

export interface CreatePromoCodeDto {
  code: string;
  description?: string;
  eventId?: number;
  organizerId?: number;
  discountPercent?: number;
  discountAmount?: number;
  minimumPurchase?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  validFrom?: string;
  validTo?: string;
}

export interface UpdatePromoCodeDto extends CreatePromoCodeDto {
  isActive: boolean;
}

// ===== PROMO CODE SERVICE =====
class PromoCodeService {
  /**
   * Validate a promo code
   */
  async validatePromoCode(
    data: ValidatePromoCodeDto
  ): Promise<PromoCode> {
    // Normalize field names to match backend DTO
    const requestData = {
      Code: data.code || data.promoCode || "",
      EventId: data.eventId,
      OrderTotal: data.orderTotal || data.totalAmount || 0,
    };
    const response = await apiClient.post<PromoCode>(
      "/PromoCode/validate",
      requestData
    );
    // apiClient interceptor already extracts data from ApiResponse wrapper
    return response.data;
  }

  /**
   * Calculate discount for a promo code
   */
  async calculateDiscount(
    data: ValidatePromoCodeDto
  ): Promise<number> {
    // Normalize field names to match backend DTO
    const requestData = {
      Code: data.code || data.promoCode || "",
      EventId: data.eventId,
      OrderTotal: data.orderTotal || data.totalAmount || 0,
    };
    const response = await apiClient.post<number>(
      "/PromoCode/calculate-discount",
      requestData
    );
    // apiClient interceptor already extracts data from ApiResponse wrapper
    return response.data;
  }

  /**
   * Get all active promo codes
   */
  async getAll(): Promise<PromoCode[]> {
    const response = await apiClient.get<PromoCode[]>("/PromoCode");
    return response.data;
  }

  /**
   * Get promo code by ID
   */
  async getById(id: number): Promise<PromoCode> {
    const response = await apiClient.get<PromoCode>(`/PromoCode/${id}`);
    return response.data;
  }

  /**
   * Get promo codes by event ID
   */
  async getByEventId(eventId: number): Promise<PromoCode[]> {
    const response = await apiClient.get<PromoCode[]>(
      `/PromoCode/event/${eventId}`
    );
    return response.data;
  }

  /**
   * Create a new promo code
   */
  async create(data: CreatePromoCodeDto): Promise<PromoCode> {
    const response = await apiClient.post<PromoCode>("/PromoCode", data);
    return response.data;
  }

  /**
   * Update an existing promo code
   */
  async update(id: number, data: UpdatePromoCodeDto): Promise<PromoCode> {
    const response = await apiClient.put<PromoCode>(`/PromoCode/${id}`, data);
    return response.data;
  }

  /**
   * Delete a promo code
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/PromoCode/${id}`);
  }
}

export const promoCodeService = new PromoCodeService();
