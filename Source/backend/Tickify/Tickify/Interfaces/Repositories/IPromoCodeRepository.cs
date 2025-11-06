using Tickify.Models;

namespace Tickify.Interfaces.Repositories;

public interface IPromoCodeRepository
{
    Task<PromoCode?> GetByIdAsync(int id);
    Task<PromoCode?> GetByCodeAsync(string code);
    Task<IEnumerable<PromoCode>> GetByEventIdAsync(int eventId);
    Task<IEnumerable<PromoCode>> GetActivePromoCodesAsync();
    Task<PromoCode> CreateAsync(PromoCode promoCode);
    Task<PromoCode> UpdateAsync(PromoCode promoCode);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<bool> IsPromoCodeValidAsync(string code, int eventId);
    Task<int> GetUsageCountAsync(int promoCodeId);
    Task<bool> IncrementUsageAsync(int promoCodeId);
}
