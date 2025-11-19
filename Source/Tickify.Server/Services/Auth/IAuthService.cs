using Tickify.DTOs.Auth;

namespace Tickify.Services.Auth;

public interface IAuthService
{
    Task<LoginResponse> RegisterAsync(RegisterDto registerDto);

    Task<LoginResponse> LoginAsync(LoginDto loginDto);

    Task<LoginResponse> RefreshTokenAsync(RefreshTokenDto refreshTokenDto);

    Task LogoutAsync(int userId, string refreshToken);

    Task VerifyEmailAsync(VerifyEmailDto verifyDto);

    Task ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto);

    Task ResetPasswordAsync(ResetPasswordDto resetPasswordDto);

    Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);

    Task<LoginResponse> ExternalLoginAsync(ExternalLoginDto externalLoginDto);

    Task RequestOrganizerRoleAsync(int userId, OrganizerRequestDto requestDto);
}
