using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Auth;
using Tickify.Exceptions;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Services.Email;
using Google.Apis.Auth;
using System.Net.Http;

namespace Tickify.Services.Auth;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IUserRoleRepository userRoleRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IJwtService jwtService,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _jwtService = jwtService;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task RegisterAsync(RegisterDto registerDto)
    {
        var existingUser = await _userRepository.GetUserByEmailAsync(registerDto.Email);

        if (existingUser != null)
        {
            throw new BadRequestException("Email đã được sử dụng");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

        var verificationToken = Guid.NewGuid().ToString();

        var user = new User
        {
            Email = registerDto.Email.ToLower(),
            PasswordHash = passwordHash,
            FullName = registerDto.FullName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            IsEmailVerified = false, // Chưa verify email
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24) // Token hết hạn sau 24h
        };

        await _userRepository.AddUserAsync(user);

        var userRole = await _roleRepository.GetRoleByNameAsync("User");
        if (userRole != null)
        {
            await _userRoleRepository.AddUserRoleAsync(new UserRole
            {
                User = user,
                Role = userRole,
                AssignedAt = DateTime.UtcNow
            });
        }

        await _userRepository.SaveChangesAsync();

        _ = Task.Run(async () =>
        {
            try
            {
                var verificationLink = $"{_configuration["AppSettings:FrontendUrl"]}/email-verification?token={verificationToken}&email={user.Email}";
                await _emailService.SendWelcomeEmailAsync(user.Email, user.FullName);
                await _emailService.SendVerificationEmailAsync(user.Email, user.FullName, verificationLink);
            }
            catch
            {
                //log error
            }
        });
    }

    public async Task<LoginResponse> LoginAsync(LoginDto loginDto)
    {
        var user = await _userRepository.GetUserByEmailAsync(loginDto.Email);

        if (user == null)
        {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }

        if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
        }

        if (!user.IsEmailVerified)
        {
            throw new UnauthorizedException("Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư của bạn.");
        }

        return await GenerateLoginResponse(user);
    }

    public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenDto refreshTokenDto)
    {
        var refreshToken = await _refreshTokenRepository.GetRefreshTokenAsync(refreshTokenDto.RefreshToken);

        if (refreshToken == null)
        {
            throw new UnauthorizedException("Refresh token không hợp lệ");
        }

        if (!refreshToken.IsActive)
        {
            throw new UnauthorizedException("Refresh token đã hết hạn hoặc bị vô hiệu hóa");
        }

        if (!refreshToken.User.IsActive)
        {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
        }

        refreshToken.IsUsed = true;
        _refreshTokenRepository.UpdateRefreshToken(refreshToken);

        var response = await GenerateLoginResponse(refreshToken.User);

        await _refreshTokenRepository.SaveChangesAsync();

        return response;
    }

    public async Task LogoutAsync(int userId, string refreshToken)
    {
        var token = await _refreshTokenRepository.GetRefreshTokenAsync(refreshToken);

        if (token != null)
        {
            token.IsRevoked = true;
            _refreshTokenRepository.UpdateRefreshToken(token);
            await _refreshTokenRepository.SaveChangesAsync();
        }
    }

    public async Task VerifyEmailAsync(VerifyEmailDto verifyDto)
    {
        var user = await _userRepository.GetUserByEmailVerificationTokenAsync(verifyDto.Token);

        if (user == null)
        {
            throw new BadRequestException("Token xác thực không hợp lệ");
        }

        if (user.EmailVerificationTokenExpiry < DateTime.UtcNow)
        {
            throw new BadRequestException("Token xác thực đã hết hạn");
        }

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();
    }

    public async Task ResendVerificationEmailAsync(string email)
    {
        var user = await _userRepository.GetUserByEmailAsync(email);

        if (user == null)
        {
            // Don't reveal if user exists or not for security
            return;
        }

        if (user.IsEmailVerified)
        {
            throw new BadRequestException("Email đã được xác thực");
        }

        // Generate new verification token
        var verificationToken = Guid.NewGuid().ToString();
        user.EmailVerificationToken = verificationToken;
        user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        // Send verification email
        _ = Task.Run(async () =>
        {
            try
            {
                var verificationLink = $"{_configuration["AppSettings:FrontendUrl"]}/email-verification?token={verificationToken}&email={user.Email}";
                await _emailService.SendVerificationEmailAsync(user.Email, user.FullName, verificationLink);
            }
            catch
            {
                // Log error
            }
        });
    }

    public async Task ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto)
    {
        var user = await _userRepository.GetUserByEmailAsync(forgotPasswordDto.Email);

        if (user == null)
        {
            return; 
        }

        var resetToken = Guid.NewGuid().ToString();
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1); // Token hết hạn sau 1h

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        //send email
        _ = Task.Run(async () =>
        {
            try
            {
                var resetLink = $"{_configuration["AppSettings:FrontendUrl"]}/reset-password?token={resetToken}&email={user.Email}";
                await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetLink);
            }
            catch
            {
                // Log error
            }
        });
    }

    public async Task ResetPasswordAsync(ResetPasswordDto resetPasswordDto)
    {
        var user = await _userRepository.GetUserByPasswordResetTokenAsync(resetPasswordDto.Token);

        if (user == null)
        {
            throw new BadRequestException("Token reset password không hợp lệ");
        }

        if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
        {
            throw new BadRequestException("Token reset password đã hết hạn");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(resetPasswordDto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        var refreshTokens = await _refreshTokenRepository.GetRefreshTokensByUserIdAsync(user.Id);

        foreach (var token in refreshTokens)
        {
            token.IsRevoked = true;
        }

        await _refreshTokenRepository.SaveChangesAsync();
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("Không tìm thấy user");
        }

        if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
        {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();
    }

    public async Task<LoginResponse> ExternalLoginAsync(ExternalLoginDto externalLoginDto)
    {
        // Validate the provider
        if (externalLoginDto.Provider != "Google" && externalLoginDto.Provider != "Facebook")
        {
            throw new BadRequestException("Provider không hợp lệ");
        }

        // Validate provider data
        if (string.IsNullOrEmpty(externalLoginDto.Email))
        {
            throw new BadRequestException("Email không được để trống");
        }

        if (string.IsNullOrEmpty(externalLoginDto.ProviderId))
        {
            throw new BadRequestException("Provider ID không được để trống");
        }

        // Check if user exists with this provider
        var existingUser = await _userRepository.GetUserByProviderAsync(
            externalLoginDto.Provider, 
            externalLoginDto.ProviderId
        );

        if (existingUser != null)
        {
            // User exists, return login response
            if (!existingUser.IsActive)
            {
                throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
            }

            return await GenerateLoginResponse(existingUser);
        }

        // Check if user exists with this email (from local registration)
        var userByEmail = await _userRepository.GetUserByEmailAsync(externalLoginDto.Email);

        if (userByEmail != null)
        {
            // Link the provider to existing account
            userByEmail.AuthProvider = externalLoginDto.Provider;
            userByEmail.ProviderId = externalLoginDto.ProviderId;
            userByEmail.ProviderDisplayName = externalLoginDto.FullName;
            // DO NOT automatically verify email for existing local accounts
            // Only OAuth providers verify their own emails, not existing accounts
            userByEmail.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(externalLoginDto.ProfilePicture) && string.IsNullOrEmpty(userByEmail.ProfilePicture))
            {
                userByEmail.ProfilePicture = externalLoginDto.ProfilePicture;
            }

            _userRepository.UpdateUser(userByEmail);
            await _userRepository.SaveChangesAsync();

            if (!userByEmail.IsActive)
            {
                throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
            }

            // Check if email is verified for local accounts
            if (!userByEmail.IsEmailVerified)
            {
                throw new UnauthorizedException("Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư của bạn.");
            }

            return await GenerateLoginResponse(userByEmail);
        }

        // Create new user
        var newUser = new User
        {
            Email = externalLoginDto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Random password for OAuth users
            FullName = externalLoginDto.FullName ?? externalLoginDto.Email,
            ProfilePicture = externalLoginDto.ProfilePicture,
            AuthProvider = externalLoginDto.Provider,
            ProviderId = externalLoginDto.ProviderId,
            ProviderDisplayName = externalLoginDto.FullName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            IsEmailVerified = true // OAuth providers verify email
        };

        await _userRepository.AddUserAsync(newUser);

        // Assign User role
        var userRole = await _roleRepository.GetRoleByNameAsync("User");
        if (userRole != null)
        {
            await _userRoleRepository.AddUserRoleAsync(new UserRole
            {
                User = newUser,
                Role = userRole,
                AssignedAt = DateTime.UtcNow
            });
        }

        await _userRepository.SaveChangesAsync();

        return await GenerateLoginResponse(newUser);
    }

    private async Task<LoginResponse> GenerateLoginResponse(User user)
    {
        if (user.UserRoles == null || !user.UserRoles.Any())
        {
            await _userRepository.LoadUserRolesAsync(user);
        }

        var roles = user.UserRoles?.Select(ur => ur.Role.Name).ToList() ?? new List<string>();

        // Get organizerId if user is an organizer
        int? organizerId = null;
        if (roles.Contains("Organizer"))
        {
            var organizer = await _userRepository.GetOrganizerByUserIdAsync(user.Id);
            if (organizer != null)
            {
                organizerId = organizer.Id;
            }
        }

        var accessToken = _jwtService.GenerateAccessToken(user.Id, user.Email, roles, organizerId);

        var refreshToken = _jwtService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(30), // Refresh token hết hạn sau 30 ngày
            IsUsed = false,
            IsRevoked = false
        };

        await _refreshTokenRepository.AddRefreshTokenAsync(refreshTokenEntity);
        await _refreshTokenRepository.SaveChangesAsync();


        var expiryMinutes = int.Parse(_configuration["JwtSettings:ExpiryInMinutes"] ?? "60");

        return new LoginResponse
        {
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Roles = roles,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
        };
    }
}
