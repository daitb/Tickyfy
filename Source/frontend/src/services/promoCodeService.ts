import { apiClient } from "./apiClient";

export interface PromoCodeDto {
  id: number;
  code: string;
  discountType: "Percentage" | "FixedAmount";
  discountValue: number;
  validFrom: string;
  validTo: string;
  maxUses: number;
  currentUses: number;
  minimumPurchase?: number;
  isActive: boolean;
}

export interface ValidatePromoCodeDto {
  code: string;
}

export interface PromoCodeValidationResult {
  isValid: boolean;
  discountAmount: number;
  message: string;
}

export interface CreatePromoCodeDto {
  code: string;
  discountType: "Percentage" | "FixedAmount";
  discountValue: number;
  validFrom: string;
  validTo: string;
  maxUses: number;
  minimumPurchase?: number;
  eventId?: number;
}

export interface UpdatePromoCodeDto {
  discountValue?: number;
  validFrom?: string;
  validTo?: string;
  maxUses?: number;
  minimumPurchase?: number;
  isActive?: boolean;
}

const promoCodeService = {
  /**
   * Validate promo code
   * POST /api/promocodes/validate
   */
  validatePromoCode: async (
    code: string
  ): Promise<PromoCodeValidationResult> => {
    const response = await apiClient.post<PromoCodeValidationResult>(
      "/promocodes/validate",
      { code }
    );
    return response.data;
  },

  /**
   * Get all promo codes (Organizer/Admin)
   * GET /api/promocodes
   */
  getPromoCodes: async (): Promise<PromoCodeDto[]> => {
    const response = await apiClient.get<PromoCodeDto[]>("/promocodes");
    return response.data;
  },

  /**
   * Create promo code (Organizer/Admin)
   * POST /api/promocodes
   */
  createPromoCode: async (data: CreatePromoCodeDto): Promise<PromoCodeDto> => {
    const response = await apiClient.post<PromoCodeDto>("/promocodes", data);
    return response.data;
  },

  /**
   * Update promo code (Organizer/Admin)
   * PUT /api/promocodes/{id}
   */
  updatePromoCode: async (
    id: number,
    data: UpdatePromoCodeDto
  ): Promise<PromoCodeDto> => {
    const response = await apiClient.put<PromoCodeDto>(
      `/promocodes/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete promo code (Organizer/Admin)
   * DELETE /api/promocodes/{id}
   */
  deletePromoCode: async (id: number): Promise<void> => {
    await apiClient.delete(`/promocodes/${id}`);
  },
};

export default promoCodeService;
