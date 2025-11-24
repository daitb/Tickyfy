using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Common;
using Tickify.DTOs.Admin;
using Tickify.Interfaces.Services;

namespace Tickify.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }
}
