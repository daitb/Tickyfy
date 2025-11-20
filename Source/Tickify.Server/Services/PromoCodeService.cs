using AutoMapper;
using Tickify.DTOs.PromoCode;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services;

public class PromoCodeService : IPromoCodeService
{
    private readonly IPromoCodeRepository _promoCodeRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public PromoCodeService(IPromoCodeRepository promoCodeRepository, IUserRepository userRepository, IMapper mapper)
    {
        _promoCodeRepository = promoCodeRepository;
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<PromoCodeDto> CreateAsync(CreatePromoCodeDto createDto, int createdByUserId){
        // Check if user exists
        var user = await _userRepository.GetUserByIdAsync(createdByUserId);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {createdByUserId} not found");
        }

        // Validate dates
        DateTime validFrom = createDto.ValidFrom ?? DateTime.UtcNow;
        DateTime validTo = createDto.ValidTo ?? validFrom.AddMonths(1);

        // Ensure ValidTo is after ValidFrom
        if (validTo <= validFrom)
        {
            validTo = validFrom.AddMonths(1);
        }

        var promoCode = new PromoCode
        {
            Code = createDto.Code,
            Description = createDto.Description,
            EventId = createDto.EventId,
            OrganizerId = createDto.OrganizerId,
            DiscountPercent = createDto.DiscountPercent,
            DiscountAmount = createDto.DiscountAmount,
            MinimumPurchase = createDto.MinimumPurchase,
            MaxUses = createDto.MaxUses,
            MaxUsesPerUser = createDto.MaxUsesPerUser,
            ValidFrom = validFrom,
            ValidTo = validTo,
            CreatedByUserId = createdByUserId
        };

        var created = await _promoCodeRepository.CreateAsync(promoCode);
        return _mapper.Map<PromoCodeDto>(created);
    }

public async Task<PromoCodeDto> UpdateAsync(int id, UpdatePromoCodeDto updateDto)
{
    var existing = await _promoCodeRepository.GetByIdAsync(id);
    if (existing == null)
        throw new NotFoundException($"Promo code with ID {id} not found");

    existing.Code = updateDto.Code;
    existing.Description = updateDto.Description;
    existing.EventId = updateDto.EventId;
    existing.OrganizerId = updateDto.OrganizerId;
    existing.DiscountPercent = updateDto.DiscountPercent;
    existing.DiscountAmount = updateDto.DiscountAmount;
    existing.MinimumPurchase = updateDto.MinimumPurchase;
    existing.MaxUses = updateDto.MaxUses;
    existing.MaxUsesPerUser = updateDto.MaxUsesPerUser;
    // Only update dates if the client provided them; otherwise keep existing values
    if (updateDto.ValidFrom.HasValue)
        existing.ValidFrom = updateDto.ValidFrom.Value;
    if (updateDto.ValidTo.HasValue)
        existing.ValidTo = updateDto.ValidTo.Value;
    existing.IsActive = updateDto.IsActive;

    var updated = await _promoCodeRepository.UpdateAsync(existing);
    return _mapper.Map<PromoCodeDto>(updated);
}

public async Task<bool> DeleteAsync(int id)
{
    return await _promoCodeRepository.DeleteAsync(id);
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
