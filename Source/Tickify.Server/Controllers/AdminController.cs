using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Common;
using Tickify.DTOs.Admin;
using Tickify.Interfaces.Services;
using Tickify.Services.Email;

namespace Tickify.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, IEmailService emailService, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> TestEmailSending(string to, string name)
    {
        await _emailService.SendWelcomeEmailAsync(to, name);
        return Ok(new { Message = "Test welcome email sent successfully." });
    }
}
