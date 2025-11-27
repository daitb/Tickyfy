namespace Tickify.DTOs.PromoCode;

public class UpdatePromoCodeDto
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? EventId { get; set; }
    public int? OrganizerId { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? MinimumPurchase { get; set; }
    public int? MaxUses { get; set; }
    public int? MaxUsesPerUser { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public bool IsActive { get; set; }
}