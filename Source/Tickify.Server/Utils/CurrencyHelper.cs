using System.Globalization;

namespace Tickify.Utils;

public static class CurrencyHelper
{
    private static readonly CultureInfo vnCulture = new CultureInfo("vi-VN");
    
    /// <summary>
    /// Format amount to VND currency string (e.g., "1.000.000 ₫")
    /// </summary>
    public static string FormatVND(decimal amount)
    {
        return amount.ToString("N0", vnCulture) + " ₫";
    }
    
    /// <summary>
    /// Convert USD to VND (approximate exchange rate: 1 USD = 24,000 VND)
    /// Use this for migration from existing USD prices
    /// </summary>
    public static decimal ConvertUsdToVnd(decimal usdAmount)
    {
        const decimal EXCHANGE_RATE = 24000m;
        return Math.Round(usdAmount * EXCHANGE_RATE, 0);
    }
    
    /// <summary>
    /// Parse VND string to decimal (removes formatting)
    /// </summary>
    public static decimal ParseVND(string vndString)
    {
        // Remove currency symbol and spaces
        var cleaned = vndString.Replace("₫", "").Replace(" ", "").Replace(".", "");
        return decimal.Parse(cleaned);
    }
}
