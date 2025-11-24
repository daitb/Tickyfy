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
    private readonly IEventRepository _eventRepository;
    private readonly IMapper _mapper;

    public PromoCodeService(IPromoCodeRepository promoCodeRepository, IUserRepository userRepository, IEventRepository eventRepository, IMapper mapper)
    {
        _promoCodeRepository = promoCodeRepository;
        _userRepository = userRepository;
        _eventRepository = eventRepository;
        _mapper = mapper;
    }

    public async Task<PromoCodeDto> CreateAsync(CreatePromoCodeDto createDto, int createdByUserId){
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(createDto.Code))
            {
                throw new BadRequestException("Promo code is required");
            }

            if (string.IsNullOrWhiteSpace(createDto.Description))
            {
                throw new BadRequestException("Description is required");
            }

            // Validate discount: must have either percentage OR amount, not both
            if (!createDto.DiscountPercent.HasValue && !createDto.DiscountAmount.HasValue)
            {
                throw new BadRequestException("Either discount percentage or discount amount must be provided");
            }

            if (createDto.DiscountPercent.HasValue && createDto.DiscountAmount.HasValue)
            {
                throw new BadRequestException("Cannot set both discount percentage and discount amount. Please choose one");
            }

            // Validate discount percentage range
            if (createDto.DiscountPercent.HasValue && (createDto.DiscountPercent.Value <= 0 || createDto.DiscountPercent.Value > 100))
            {
                throw new BadRequestException("Discount percentage must be between 1 and 100");
            }

            // Validate discount amount
            if (createDto.DiscountAmount.HasValue && createDto.DiscountAmount.Value <= 0)
            {
                throw new BadRequestException("Discount amount must be greater than 0");
            }

            // Check if user exists
            var user = await _userRepository.GetUserByIdAsync(createdByUserId);
            if (user == null)
            {
                throw new NotFoundException($"User with ID {createdByUserId} not found");
            }

            // Check if promo code already exists
            var existingCode = await _promoCodeRepository.GetByCodeAsync(createDto.Code);
            if (existingCode != null)
            {
                throw new ConflictException($"Promo code '{createDto.Code}' already exists");
            }

            // Check permissions: only organizer of the event or admin can create promo codes for that event
            if (createDto.EventId.HasValue)
            {
                var eventEntity = await _eventRepository.GetByIdAsync(createDto.EventId.Value);
                if (eventEntity == null)
                {
                    throw new NotFoundException($"Event with ID {createDto.EventId.Value} not found");
                }

                // Check if user is admin or the organizer of this event
                var isAdmin = user.UserRoles?.Any(ur => ur.Role?.Name == "Admin") ?? false;
                var isEventOrganizer = eventEntity.OrganizerId == createdByUserId;

                if (!isAdmin && !isEventOrganizer)
                {
                    throw new ForbiddenException("You can only create promo codes for events you organize, or you must be an admin");
                }
            }

            // Validate dates
            if (!createDto.ValidFrom.HasValue)
            {
                throw new BadRequestException("Valid from date is required");
            }

            if (!createDto.ValidTo.HasValue)
            {
                throw new BadRequestException("Valid to date is required");
            }

            if (createDto.ValidTo.Value <= createDto.ValidFrom.Value)
            {
                throw new BadRequestException("Valid to date must be after valid from date");
            }

            var promoCode = new PromoCode
            {
                Code = createDto.Code.ToUpper(),
                Description = createDto.Description,
                EventId = createDto.EventId,
                OrganizerId = createDto.OrganizerId,
                DiscountPercent = createDto.DiscountPercent,
                DiscountAmount = createDto.DiscountAmount,
                MinimumPurchase = createDto.MinimumPurchase,
                MaxUses = createDto.MaxUses,
                MaxUsesPerUser = createDto.MaxUsesPerUser,
                ValidFrom = createDto.ValidFrom.Value,
                ValidTo = createDto.ValidTo.Value,
                CreatedByUserId = createdByUserId
            };

            var created = await _promoCodeRepository.CreateAsync(promoCode);
            return _mapper.Map<PromoCodeDto>(created);
        }
        catch (Exception ex)
        {
            // Log detailed error information
            Console.WriteLine($"[PromoCodeService.CreateAsync] Error creating promo code '{createDto?.Code}': {ex.Message}");
            Console.WriteLine($"[PromoCodeService.CreateAsync] CreatedByUserId: {createdByUserId}");
            Console.WriteLine($"[PromoCodeService.CreateAsync] EventId: {createDto?.EventId}");
            Console.WriteLine($"[PromoCodeService.CreateAsync] StackTrace: {ex.StackTrace}");
            throw;
        }
    }

public async Task<PromoCodeDto> UpdateAsync(int id, UpdatePromoCodeDto updateDto)
{
    try
    {
        var existing = await _promoCodeRepository.GetByIdAsync(id);
        if (existing == null)
            throw new NotFoundException($"Promo code with ID {id} not found");

        // Validate required fields
        if (string.IsNullOrWhiteSpace(updateDto.Code))
        {
            throw new BadRequestException("Promo code is required");
        }

        if (string.IsNullOrWhiteSpace(updateDto.Description))
        {
            throw new BadRequestException("Description is required");
        }

        // Validate discount: must have either percentage OR amount, not both
        if (!updateDto.DiscountPercent.HasValue && !updateDto.DiscountAmount.HasValue)
        {
            throw new BadRequestException("Either discount percentage or discount amount must be provided");
        }

        if (updateDto.DiscountPercent.HasValue && updateDto.DiscountAmount.HasValue)
        {
            throw new BadRequestException("Cannot set both discount percentage and discount amount. Please choose one");
        }

        // Validate discount percentage range
        if (updateDto.DiscountPercent.HasValue && (updateDto.DiscountPercent.Value <= 0 || updateDto.DiscountPercent.Value > 100))
        {
            throw new BadRequestException("Discount percentage must be between 1 and 100");
        }

        // Validate discount amount
        if (updateDto.DiscountAmount.HasValue && updateDto.DiscountAmount.Value <= 0)
        {
            throw new BadRequestException("Discount amount must be greater than 0");
        }

        // Validate dates
        if (!updateDto.ValidFrom.HasValue)
        {
            throw new BadRequestException("Valid from date is required");
        }

        if (!updateDto.ValidTo.HasValue)
        {
            throw new BadRequestException("Valid to date is required");
        }

        if (updateDto.ValidTo.Value <= updateDto.ValidFrom.Value)
        {
            throw new BadRequestException("Valid to date must be after valid from date");
        }

        // Get current user to check permissions
        var currentUserIdClaim = System.Security.Claims.ClaimsPrincipal.Current?.FindFirst("userId") ??
                                System.Security.Claims.ClaimsPrincipal.Current?.FindFirst("sub") ??
                                System.Security.Claims.ClaimsPrincipal.Current?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        
        if (currentUserIdClaim != null && int.TryParse(currentUserIdClaim.Value, out var currentUserId))
        {
            var currentUser = await _userRepository.GetUserByIdAsync(currentUserId);
            var isAdmin = currentUser?.UserRoles?.Any(ur => ur.Role?.Name == "Admin") ?? false;

            // Check permissions for event-specific promo codes
            if (existing.EventId.HasValue)
            {
                var eventEntity = await _eventRepository.GetByIdAsync(existing.EventId.Value);
                var isEventOrganizer = eventEntity?.OrganizerId == currentUserId;

                if (!isAdmin && !isEventOrganizer)
                {
                    throw new ForbiddenException("You can only update promo codes for events you organize, or you must be an admin");
                }
            }
            else if (!isAdmin)
            {
                throw new ForbiddenException("Only admins can update global promo codes");
            }
        }

        // Check for duplicate code if code is being changed
        if (!string.Equals(existing.Code, updateDto.Code, StringComparison.OrdinalIgnoreCase))
        {
            var duplicateCode = await _promoCodeRepository.GetByCodeAsync(updateDto.Code);
            if (duplicateCode != null && duplicateCode.Id != id)
            {
                throw new ConflictException($"Promo code '{updateDto.Code}' already exists");
            }
        }

        // Update all fields with new values from updateDto
        existing.Code = updateDto.Code.ToUpper();
        existing.Description = updateDto.Description;
        existing.DiscountPercent = updateDto.DiscountPercent;
        existing.DiscountAmount = updateDto.DiscountAmount;
        existing.MinimumPurchase = updateDto.MinimumPurchase;
        existing.MaxUses = updateDto.MaxUses;
        existing.MaxUsesPerUser = updateDto.MaxUsesPerUser;
        existing.ValidFrom = updateDto.ValidFrom.Value;
        existing.ValidTo = updateDto.ValidTo.Value;
        existing.IsActive = updateDto.IsActive;

        // Update optional fields only if provided
        if (updateDto.EventId.HasValue)
            existing.EventId = updateDto.EventId.Value;
        
        if (updateDto.OrganizerId.HasValue)
            existing.OrganizerId = updateDto.OrganizerId.Value;

        var updated = await _promoCodeRepository.UpdateAsync(existing);
        return _mapper.Map<PromoCodeDto>(updated);
    }
    catch (Exception ex)
    {
        // Log detailed error information
        Console.WriteLine($"[PromoCodeService.UpdateAsync] Error updating promo code ID {id}: {ex.Message}");
        Console.WriteLine($"[PromoCodeService.UpdateAsync] UpdateDto Code: {updateDto?.Code}");
        Console.WriteLine($"[PromoCodeService.UpdateAsync] StackTrace: {ex.StackTrace}");
        throw;
    }
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

    public async Task<IEnumerable<PromoCodeDto>> GetAllPromoCodesForUserAsync(int userId, string userRole)
    {
        IEnumerable<PromoCode> promoCodes;

        // Admin can see all promo codes
        if (userRole == "Admin")
        {
            promoCodes = await _promoCodeRepository.GetAllAsync();
        }
        // Organizer can only see their promo codes
        else if (userRole == "Organizer")
        {
            promoCodes = await _promoCodeRepository.GetByOrganizerIdAsync(userId);
        }
        else
        {
            // Other roles cannot see promo codes
            return new List<PromoCodeDto>();
        }

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
