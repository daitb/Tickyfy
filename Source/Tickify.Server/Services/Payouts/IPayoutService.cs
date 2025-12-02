using System.Security.Claims;
using Tickify.DTOs.Payout;

namespace Tickify.Services.Payouts;

public interface IPayoutService
{
    Task<PayoutDto> RequestPayoutAsync(RequestPayoutDto dto, ClaimsPrincipal user);
    Task<IEnumerable<PayoutDto>> GetAllPayoutsAsync(ClaimsPrincipal user);
    Task<PayoutDto?> GetPayoutByIdAsync(int id, ClaimsPrincipal user);
    Task<PayoutDto> ApprovePayoutAsync(int id, ClaimsPrincipal admin, ApprovePayoutDto dto);
    Task<PayoutDto> RejectPayoutAsync(int id, ClaimsPrincipal admin, RejectPayoutDto dto);
    Task<PayoutStatsDto> GetOrganizerStatsAsync(int organizerId, ClaimsPrincipal user);
}

