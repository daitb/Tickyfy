using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tickify.Common;
using Tickify.DTOs.Auth;
using Tickify.Services.Auth;

namespace Tickify.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        await _authService.RegisterAsync(registerDto);
        
        _logger.LogInformation("User {Email} registered successfully", registerDto.Email);
        
        return Ok(ApiResponse<object?>.SuccessResponse(
            null,
            "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
        ));
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var response = await _authService.LoginAsync(loginDto);
        
        _logger.LogInformation("User {Email} logged in successfully", loginDto.Email);
        
        return Ok(ApiResponse<LoginResponse>.SuccessResponse(
            response,
            "Đăng nhập thành công"
        ));
    }

    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        var response = await _authService.RefreshTokenAsync(refreshTokenDto);
        
        _logger.LogInformation("Token refreshed for user {UserId}", response.UserId);
        
        return Ok(ApiResponse<LoginResponse>.SuccessResponse(
            response,
            "Làm mới token thành công"
        ));
    }

    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenDto refreshTokenDto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        
        await _authService.LogoutAsync(userId, refreshTokenDto.RefreshToken);
        
        _logger.LogInformation("User {UserId} logged out", userId);
        
        return Ok(ApiResponse<object?>.SuccessResponse(
            null,
            "Đăng xuất thành công"
        ));
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto verifyEmailDto)
    {
        await _authService.VerifyEmailAsync(verifyEmailDto);
        
        _logger.LogInformation("Email verified with token {Token}", verifyEmailDto.Token);
        
        return Ok(ApiResponse<object?>.SuccessResponse(
            null,
            "Xác thực email thành công"
        ));
    }

    [HttpPost("resend-verification")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationDto resendDto)
    {
        await _authService.ResendVerificationEmailAsync(resendDto.Email);
        
        _logger.LogInformation("Verification email resent to {Email}", resendDto.Email);
        
        return Ok(ApiResponse<object?>.SuccessResponse(
            null,
            "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư."
        ));
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
    {
        await _authService.ForgotPasswordAsync(forgotPasswordDto);
        
        _logger.LogInformation("Password reset email sent to {Email}", forgotPasswordDto.Email);
        
        return Ok(ApiResponse<object?>.SuccessResponse(
            null,
            "Nếu email tồn tại, link reset password đã được gửi"
        ));
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
    {
        await _authService.ResetPasswordAsync(resetPasswordDto);
        
        _logger.LogInformation("Password reset successfully");
        
        return Ok(ApiResponse<object?>.SuccessResponse(
            null,
            "Reset password thành công"
        ));
    }

    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        
        await _authService.ChangePasswordAsync(userId, changePasswordDto);
        
        _logger.LogInformation("User {UserId} changed password", userId);
        
        return Ok(ApiResponse<object?>.SuccessResponse(
            null,
            "Đổi mật khẩu thành công"
        ));
    }

    [HttpPost("external-login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExternalLogin([FromBody] ExternalLoginDto externalLoginDto)
    {
        try
        {
            _logger.LogInformation("External login attempt - Provider: {Provider}, Email: {Email}", 
                externalLoginDto.Provider, externalLoginDto.Email);

            var response = await _authService.ExternalLoginAsync(externalLoginDto);
            
            _logger.LogInformation("User {Email} logged in via {Provider} successfully", 
                externalLoginDto.Email, externalLoginDto.Provider);
            
            return Ok(ApiResponse<LoginResponse>.SuccessResponse(
                response,
                $"Đăng nhập bằng {externalLoginDto.Provider} thành công"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "External login failed - Provider: {Provider}, Email: {Email}", 
                externalLoginDto.Provider, externalLoginDto.Email);
            throw;
        }
    }
}
