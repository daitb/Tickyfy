using Tickify.DTOs.Auth;

namespace Tickify.Services.Auth;

public interface IAuthService
{
    Task RegisterAsync(RegisterDto registerDto);

    Task<LoginResponse> LoginAsync(LoginDto loginDto);

    Task<LoginResponse> RefreshTokenAsync(RefreshTokenDto refreshTokenDto);

    Task LogoutAsync(int userId, string refreshToken);

    Task VerifyEmailAsync(VerifyEmailDto verifyDto);

    Task ResendVerificationEmailAsync(string email);

    Task ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto);

    Task ResetPasswordAsync(ResetPasswordDto resetPasswordDto);

    Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);

    Task<LoginResponse> ExternalLoginAsync(ExternalLoginDto externalLoginDto);
}
