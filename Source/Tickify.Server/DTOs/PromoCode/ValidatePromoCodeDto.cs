namespace Tickify.DTOs.PromoCode;

public class ValidatePromoCodeDto
{
    public string Code { get; set; } = string.Empty;
    public int EventId { get; set; }
    public decimal OrderTotal { get; set; }
}
