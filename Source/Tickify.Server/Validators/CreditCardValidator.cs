using System.Text.RegularExpressions;
using Tickify.DTOs.Payment;

namespace Tickify.Validators;

/// <summary>
/// Comprehensive validator for credit card information
/// </summary>
public static class CreditCardValidator
{
    /// <summary>
    /// Validates credit card number using Luhn algorithm (also known as mod 10 algorithm)
    /// </summary>
    public static bool ValidateLuhnAlgorithm(string cardNumber)
    {
        if (string.IsNullOrWhiteSpace(cardNumber))
            return false;

        // Remove spaces and non-digits
        cardNumber = Regex.Replace(cardNumber, @"\D", "");

        if (cardNumber.Length < 13 || cardNumber.Length > 19)
            return false;

        int sum = 0;
        bool alternate = false;

        // Process digits from right to left
        for (int i = cardNumber.Length - 1; i >= 0; i--)
        {
            int digit = cardNumber[i] - '0';

            if (alternate)
            {
                digit *= 2;
                if (digit > 9)
                    digit -= 9;
            }

            sum += digit;
            alternate = !alternate;
        }

        return sum % 10 == 0;
    }

    /// <summary>
    /// Detects card brand based on card number patterns
    /// </summary>
    public static string DetectCardBrand(string cardNumber)
    {
        if (string.IsNullOrWhiteSpace(cardNumber))
            return "Unknown";

        cardNumber = Regex.Replace(cardNumber, @"\D", "");

        if (Regex.IsMatch(cardNumber, @"^4"))
            return "Visa";
        
        if (Regex.IsMatch(cardNumber, @"^5[1-5]"))
            return "Mastercard";
        
        if (Regex.IsMatch(cardNumber, @"^3[47]"))
            return "American Express";
        
        if (Regex.IsMatch(cardNumber, @"^6(?:011|5)"))
            return "Discover";
        
        if (Regex.IsMatch(cardNumber, @"^(?:2131|1800|35)"))
            return "JCB";
        
        return "Unknown";
    }

    /// <summary>
    /// Gets last 4 digits of card number for display
    /// </summary>
    public static string GetLast4Digits(string cardNumber)
    {
        if (string.IsNullOrWhiteSpace(cardNumber))
            return "****";

        cardNumber = Regex.Replace(cardNumber, @"\D", "");
        return cardNumber.Length >= 4 ? cardNumber[^4..] : "****";
    }

    /// <summary>
    /// Validates card expiry date
    /// </summary>
    public static bool ValidateExpiryDate(int month, int year)
    {
        if (month < 1 || month > 12)
            return false;

        if (year < DateTime.Now.Year || year > DateTime.Now.Year + 30)
            return false;

        var expiryDate = new DateTime(year, month, DateTime.DaysInMonth(year, month));
        return expiryDate >= DateTime.Now.Date;
    }

    /// <summary>
    /// Validates CVV format (3 or 4 digits)
    /// </summary>
    public static bool ValidateCVV(string cvv, string cardBrand)
    {
        if (string.IsNullOrWhiteSpace(cvv))
            return false;

        cvv = Regex.Replace(cvv, @"\D", "");

        // American Express uses 4-digit CVV, others use 3
        if (cardBrand == "American Express")
            return cvv.Length == 4;

        return cvv.Length == 3;
    }

    /// <summary>
    /// Masks card number for logging/display (shows only last 4 digits)
    /// </summary>
    public static string MaskCardNumber(string cardNumber)
    {
        if (string.IsNullOrWhiteSpace(cardNumber))
            return "****-****-****-****";

        cardNumber = Regex.Replace(cardNumber, @"\D", "");
        
        if (cardNumber.Length < 4)
            return "****-****-****-****";

        var last4 = cardNumber[^4..];
        return $"****-****-****-{last4}";
    }

    /// <summary>
    /// Comprehensive validation of all card details
    /// </summary>
    public static (bool IsValid, string ErrorMessage) ValidateCardDetails(CreditCardPaymentDto dto)
    {
        // Validate card number with Luhn
        if (!ValidateLuhnAlgorithm(dto.CardNumber))
            return (false, "Số thẻ không hợp lệ");

        // Detect card brand
        var cardBrand = DetectCardBrand(dto.CardNumber);
        if (cardBrand == "Unknown")
            return (false, "Loại thẻ không được hỗ trợ");

        // Validate expiry date
        if (!ValidateExpiryDate(dto.ExpiryMonth, dto.ExpiryYear))
            return (false, "Thẻ đã hết hạn hoặc ngày hết hạn không hợp lệ");

        // Validate CVV
        if (!ValidateCVV(dto.CVV, cardBrand))
            return (false, $"CVV không hợp lệ cho thẻ {cardBrand}");

        // Validate cardholder name
        if (string.IsNullOrWhiteSpace(dto.CardholderName) || 
            !Regex.IsMatch(dto.CardholderName.Trim(), @"^[a-zA-Z\s]{2,}$"))
            return (false, "Tên chủ thẻ không hợp lệ");

        return (true, string.Empty);
    }

    /// <summary>
    /// Simulates fraud detection checks (for mock implementation)
    /// In production, this would call actual fraud detection services
    /// </summary>
    public static (bool Passed, string? Reason) SimulateFraudCheck(
        string cardNumber, 
        decimal amount, 
        string? country = null)
    {
        // Simulate fraud checks
        var last4 = GetLast4Digits(cardNumber);

        // Simulate: Block cards ending with 0000 (test scenario)
        if (last4 == "0000")
            return (false, "Thẻ bị chặn do nghi ngờ gian lận");

        // Simulate: Flag large transactions
        if (amount > 50_000_000) // > 50M VND
        {
            // In real system, this would require additional verification
            // For mock, we'll allow but log warning
        }

        return (true, null);
    }

    /// <summary>
    /// Generates a mock authorization code for successful transactions
    /// </summary>
    public static string GenerateAuthorizationCode()
    {
        var random = new Random();
        return $"AUTH{random.Next(100000, 999999)}";
    }

    /// <summary>
    /// Generates a transaction ID for credit card payments
    /// </summary>
    public static string GenerateTransactionId(int paymentId)
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = new Random().Next(1000, 9999);
        return $"CC{paymentId:D8}{timestamp}{random}";
    }
}
