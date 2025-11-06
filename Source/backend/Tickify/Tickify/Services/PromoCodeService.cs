using AutoMapper;
using Tickify.DTOs.PromoCode;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;

namespace Tickify.Services;

public class PromoCodeService : IPromoCodeService
{
    private readonly IPromoCodeRepository _promoCodeRepository;
    private readonly IMapper _mapper;

    public PromoCodeService(IPromoCodeRepository promoCodeRepository, IMapper mapper)
    {
        _promoCodeRepository = promoCodeRepository;
        _mapper = mapper;
    }

    public async Task<PromoCodeDto> GetByIdAsync(int id)
    {
        var promoCode = await _promoCodeRepository.GetByIdAsync(id);
        if (promoCode == null)
            throw new NotFoundException($"Promo code with ID {id} not found");

        return _mapper.Map<PromoCodeDto>(promoCode);
    }

    public async Task<PromoCodeDto> GetByCodeAsync(string code)
    {
        var promoCode = await _promoCodeRepository.GetByCodeAsync(code);
        if (promoCode == null)
            throw new NotFoundException($"Promo code '{code}' not found");

        return _mapper.Map<PromoCodeDto>(promoCode);
    }

    public async Task<IEnumerable<PromoCodeDto>> GetByEventIdAsync(int eventId)
    {
        var promoCodes = await _promoCodeRepository.GetByEventIdAsync(eventId);
        return _mapper.Map<IEnumerable<PromoCodeDto>>(promoCodes);
    }

    public async Task<IEnumerable<PromoCodeDto>> GetActivePromoCodesAsync()
    {
        var promoCodes = await _promoCodeRepository.GetActivePromoCodesAsync();
        return _mapper.Map<IEnumerable<PromoCodeDto>>(promoCodes);
    }

    public async Task<PromoCodeDto> ValidatePromoCodeAsync(ValidatePromoCodeDto validateDto)
    {
        var promoCode = await _promoCodeRepository.GetByCodeAsync(validateDto.Code);
        if (promoCode == null)
            throw new NotFoundException($"Promo code '{validateDto.Code}' not found");

        // Check if promo code is valid for the event
        var isValid = await _promoCodeRepository.IsPromoCodeValidAsync(validateDto.Code, validateDto.EventId);
        if (!isValid)
            throw new BadRequestException("Promo code is not valid for this event or has expired");

        // Check minimum purchase requirement
        if (promoCode.MinimumPurchase.HasValue && validateDto.OrderTotal < promoCode.MinimumPurchase.Value)
            throw new BadRequestException($"Minimum purchase of ${promoCode.MinimumPurchase.Value} required to use this promo code");

        return _mapper.Map<PromoCodeDto>(promoCode);
    }

    public async Task<decimal> CalculateDiscountAsync(string promoCode, int eventId, decimal orderTotal)
    {
        var code = await _promoCodeRepository.GetByCodeAsync(promoCode);
        if (code == null)
            throw new NotFoundException($"Promo code '{promoCode}' not found");

        var isValid = await _promoCodeRepository.IsPromoCodeValidAsync(promoCode, eventId);
        if (!isValid)
            throw new BadRequestException("Promo code is not valid");

        // Check minimum purchase
        if (code.MinimumPurchase.HasValue && orderTotal < code.MinimumPurchase.Value)
            throw new BadRequestException($"Minimum purchase of ${code.MinimumPurchase.Value} required");

        // Calculate discount
        decimal discount = 0;
        if (code.DiscountPercent.HasValue)
        {
            discount = orderTotal * (code.DiscountPercent.Value / 100);
        }
        else if (code.DiscountAmount.HasValue)
        {
            discount = code.DiscountAmount.Value;
        }

        // Ensure discount doesn't exceed order total
        return Math.Min(discount, orderTotal);
    }

    public async Task<bool> ApplyPromoCodeAsync(int promoCodeId)
    {
        return await _promoCodeRepository.IncrementUsageAsync(promoCodeId);
    }

    public async Task<int> GetUsageCountAsync(int promoCodeId)
    {
        return await _promoCodeRepository.GetUsageCountAsync(promoCodeId);
    }
}
