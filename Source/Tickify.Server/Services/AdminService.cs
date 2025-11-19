using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Admin;
using Tickify.Exceptions;
using Tickify.Interfaces.Services;
using Tickify.Models;
using Tickify.Repositories;

namespace Tickify.Services;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRoleRepository _userRoleRepository;

    public AdminService(
        ApplicationDbContext context,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IUserRoleRepository userRoleRepository)
    {
        _context = context;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
    }
}
