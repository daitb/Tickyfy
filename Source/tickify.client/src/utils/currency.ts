/**
 * Currency utility for VND (Vietnamese Dong)
 * Use this instead of hardcoded $ signs throughout the application
 */

/**
 * Format a number as VND currency
 * @param amount - The amount to format
 * @returns Formatted string like "1.000.000 ₫"
 */
export function formatVND(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "0 ₫";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Format VND without currency symbol (for input fields)
 * @param amount - The amount to format
 * @returns Formatted string like "1.000.000"
 */
export function formatVNDWithoutSymbol(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "0";
  }

  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Parse VND string back to number
 * @param vndString - String like "1.000.000 ₫" or "1.000.000"
 * @returns Number value
 */
export function parseVND(vndString: string): number {
  // Remove all non-numeric characters except minus sign
  const cleaned = vndString.replace(/[^\d-]/g, "");
  return parseInt(cleaned, 10) || 0;
}

/**
 * Convert USD to VND (approximate exchange rate for migration)
 * Use this when migrating old USD prices
 * @param usdAmount - Amount in USD
 * @returns Amount in VND
 */
export function convertUSDtoVND(usdAmount: number): number {
  const EXCHANGE_RATE = 24000; // 1 USD ≈ 24,000 VND
  return Math.round(usdAmount * EXCHANGE_RATE);
}

/**
 * Compact format for large amounts (e.g., "1,5 tr" for 1.500.000)
 * @param amount - The amount to format
 * @returns Compact formatted string
 */
export function formatVNDCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1).replace(".", ",")} tr ₫`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)} k ₫`;
  }
  return `${amount} ₫`;
}
