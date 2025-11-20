import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface ValidatePromoCodeDto {
  promoCode: string;
  eventId: string;
  totalAmount: number;
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
  ): Promise<PromoCodeValidationResult> {
    const response = await apiClient.post<PromoCodeValidationResult>(
      "/PromoCode/validate",
      data
    );
    return response.data;
  }

  /**
   * Calculate discount for a promo code
   */
  async calculateDiscount(
    data: ValidatePromoCodeDto
  ): Promise<{ discount: number }> {
    const response = await apiClient.post<{ discount: number }>(
      "/PromoCode/calculate-discount",
      data
    );
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
