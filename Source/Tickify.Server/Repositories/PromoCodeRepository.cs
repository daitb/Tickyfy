using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Interfaces.Repositories;
using Tickify.Models;

namespace Tickify.Repositories;

public class PromoCodeRepository : IPromoCodeRepository
{
    private readonly ApplicationDbContext _context;

    public PromoCodeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PromoCode?> GetByIdAsync(int id)
    {
        return await _context.PromoCodes
            .Include(p => p.Event)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<PromoCode?> GetByCodeAsync(string code)
    {
        return await _context.PromoCodes
            .Include(p => p.Event)
            .FirstOrDefaultAsync(p => p.Code == code);
    }

    public async Task<IEnumerable<PromoCode>> GetByEventIdAsync(int eventId)
    {
        return await _context.PromoCodes
            .Where(p => p.EventId == eventId)
            .ToListAsync();
    }

    public async Task<IEnumerable<PromoCode>> GetActivePromoCodesAsync()
    {
        var now = DateTime.UtcNow;
        return await _context.PromoCodes
            .Where(p => p.IsActive 
                && p.ValidFrom <= now 
                && p.ValidTo >= now
                && (p.MaxUses == null || p.CurrentUses < p.MaxUses))
            .ToListAsync();
    }

    public async Task<IEnumerable<PromoCode>> GetAllAsync()
    {
        return await _context.PromoCodes
            .Include(p => p.Event)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<PromoCode>> GetByOrganizerIdAsync(int organizerId)
    {
        return await _context.PromoCodes
            .Include(p => p.Event)
            .Where(p => p.OrganizerId == organizerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<PromoCode> CreateAsync(PromoCode promoCode)
    {
        _context.PromoCodes.Add(promoCode);
        await _context.SaveChangesAsync();
        return promoCode;
    }

    public async Task<PromoCode> UpdateAsync(PromoCode promoCode)
    {
        _context.PromoCodes.Update(promoCode);
        await _context.SaveChangesAsync();
        return promoCode;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var promoCode = await _context.PromoCodes.FindAsync(id);
        if (promoCode == null) return false;

        _context.PromoCodes.Remove(promoCode);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.PromoCodes.AnyAsync(p => p.Id == id);
    }

    public async Task<bool> IsPromoCodeValidAsync(string code, int eventId)
    {
        var now = DateTime.UtcNow;
        return await _context.PromoCodes
            .AnyAsync(p => p.Code == code
                && p.EventId == eventId
                && p.IsActive
                && p.ValidFrom <= now
                && p.ValidTo >= now
                && (p.MaxUses == null || p.CurrentUses < p.MaxUses));
    }

    public async Task<int> GetUsageCountAsync(int promoCodeId)
    {
        var promoCode = await _context.PromoCodes.FindAsync(promoCodeId);
        return promoCode?.CurrentUses ?? 0;
    }

    public async Task<bool> IncrementUsageAsync(int promoCodeId)
    {
        var promoCode = await _context.PromoCodes.FindAsync(promoCodeId);
        if (promoCode == null) return false;

        promoCode.CurrentUses++;
        await _context.SaveChangesAsync();
        return true;
    }
}
