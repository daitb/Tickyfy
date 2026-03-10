using Tickify.DTOs.PromoCode;

namespace Tickify.Interfaces.Services;

public interface IPromoCodeService
{
    Task<PromoCodeDto> GetByIdAsync(int id);
    Task<PromoCodeDto> GetByCodeAsync(string code);
    Task<IEnumerable<PromoCodeDto>> GetByEventIdAsync(int eventId);
    Task<IEnumerable<PromoCodeDto>> GetActivePromoCodesAsync();
    Task<IEnumerable<PromoCodeDto>> GetAllPromoCodesForUserAsync(int userId, string userRole);
    Task<PromoCodeDto> ValidatePromoCodeAsync(ValidatePromoCodeDto validateDto);
    Task<decimal> CalculateDiscountAsync(string promoCode, int eventId, decimal orderTotal);
    Task<bool> ApplyPromoCodeAsync(int promoCodeId);
    Task<int> GetUsageCountAsync(int promoCodeId);
    Task<PromoCodeDto> CreateAsync(CreatePromoCodeDto createDto, int createdByUserId);
    Task<PromoCodeDto> UpdateAsync(int id, UpdatePromoCodeDto updateDto, int currentUserId);
    Task<bool> DeleteAsync(int id);
}
