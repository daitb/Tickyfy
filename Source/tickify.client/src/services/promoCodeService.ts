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

// ===== PROMO CODE SERVICE =====
class PromoCodeService {
  /**
   * Validate a promo code
   */
  async validatePromoCode(
    data: ValidatePromoCodeDto
  ): Promise<PromoCodeValidationResult> {
    const response = await apiClient.post<PromoCodeValidationResult>(
      "/promocodes/validate",
      data
    );
    return response.data;
  }
}

export const promoCodeService = new PromoCodeService();
