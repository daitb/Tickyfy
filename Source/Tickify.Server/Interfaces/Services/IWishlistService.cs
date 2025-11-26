using Tickify.Common;
using Tickify.DTOs.Wishlist;

namespace Tickify.Interfaces.Services;

public interface IWishlistService
{
    Task<PagedResult<WishlistDto>> GetUserWishlistAsync(int userId, int pageNumber = 1, int pageSize = 20);
    Task<WishlistDto> AddToWishlistAsync(int userId, int eventId);
    Task RemoveFromWishlistAsync(int userId, int eventId);
    Task<bool> IsInWishlistAsync(int userId, int eventId);
    Task<int> GetWishlistCountAsync(int userId);
}

