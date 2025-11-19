using Tickify.DTOs.Admin;

namespace Tickify.Interfaces.Services;

public interface IAdminService
{
    Task<List<UserListDto>> GetAllUsersAsync(int pageNumber, int pageSize);
    Task UpdateUserRoleAsync(int userId, string roleName);
    Task<List<OrganizerRequestDto>> GetOrganizerRequestsAsync();
    Task ApproveOrganizerRequestAsync(int requestId, int adminId);
    Task RejectOrganizerRequestAsync(int requestId, int adminId);
}
