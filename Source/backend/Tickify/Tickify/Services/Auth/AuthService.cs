using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.DTOs.Auth;
using Tickify.Exceptions;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Services.Email;

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

    public async Task<LoginResponse> RegisterAsync(RegisterDto registerDto)
    {
        // 1. Kiểm tra email đã tồn tại chưa
        var existingUser = await _userRepository.GetUserByEmailAsync(registerDto.Email);

        if (existingUser != null)
        {
            throw new BadRequestException("Email đã được sử dụng");
        }

        // 2. Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

        // 3. Tạo email verification token
        var verificationToken = Guid.NewGuid().ToString();

        // 4. Tạo user mới
        var user = new User
        {
            Email = registerDto.Email.ToLower(),
            PasswordHash = passwordHash,
            FullName = registerDto.FullName,
            PhoneNumber = registerDto.PhoneNumber,
            DateOfBirth = registerDto.DateOfBirth,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            IsEmailVerified = false, // Chưa verify email
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24) // Token hết hạn sau 24h
        };

        await _userRepository.AddUserAsync(user);

        // 5. Gán role mặc định là "User"
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

        // 6. Gửi email xác thực (async, không chờ)
        _ = Task.Run(async () =>
        {
            try
            {
                var verificationLink = $"{_configuration["AppSettings:FrontendUrl"]}/verify-email?token={verificationToken}";
                await _emailService.SendVerificationEmailAsync(user.Email, user.FullName, verificationLink);
            }
            catch
            {
                // Log error nhưng không throw để không ảnh hưởng registration
            }
        });

        // 7. Tự động login và trả về token
        return await GenerateLoginResponse(user);
    }

    public async Task<LoginResponse> LoginAsync(LoginDto loginDto)
    {
        // 1. Tìm user theo email
        var user = await _userRepository.GetUserByEmailAsync(loginDto.Email);

        if (user == null)
        {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }

        // 2. Verify password
        if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }

        // 3. Kiểm tra tài khoản có active không
        if (!user.IsActive)
        {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
        }

        // 4. Tạo và trả về token
        return await GenerateLoginResponse(user);
    }

    public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenDto refreshTokenDto)
    {
        // 1. Tìm refresh token trong database
        var refreshToken = await _refreshTokenRepository.GetRefreshTokenAsync(refreshTokenDto.RefreshToken);

        if (refreshToken == null)
        {
            throw new UnauthorizedException("Refresh token không hợp lệ");
        }

        // 2. Kiểm tra refresh token còn active không
        if (!refreshToken.IsActive)
        {
            throw new UnauthorizedException("Refresh token đã hết hạn hoặc bị vô hiệu hóa");
        }

        // 3. Kiểm tra user còn active không
        if (!refreshToken.User.IsActive)
        {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
        }

        // 4. Đánh dấu refresh token cũ là đã sử dụng
        refreshToken.IsUsed = true;
        _refreshTokenRepository.UpdateRefreshToken(refreshToken);

        // 5. Tạo token mới
        var response = await GenerateLoginResponse(refreshToken.User);

        await _refreshTokenRepository.SaveChangesAsync();

        return response;
    }

    public async Task LogoutAsync(int userId, string refreshToken)
    {
        // Tìm và vô hiệu hóa refresh token
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
        // 1. Tìm user có token này
        var user = await _userRepository.GetUserByEmailVerificationTokenAsync(verifyDto.Token);

        if (user == null)
        {
            throw new BadRequestException("Token xác thực không hợp lệ");
        }

        // 2. Kiểm tra token đã hết hạn chưa
        if (user.EmailVerificationTokenExpiry < DateTime.UtcNow)
        {
            throw new BadRequestException("Token xác thực đã hết hạn");
        }

        // 3. Đánh dấu email đã được verify
        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();
    }

    public async Task ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto)
    {
        // 1. Tìm user theo email
        var user = await _userRepository.GetUserByEmailAsync(forgotPasswordDto.Email);

        // Không throw error để tránh enumerate users
        if (user == null)
        {
            return; // Vẫn trả về success để không lộ thông tin
        }

        // 2. Tạo reset token
        var resetToken = Guid.NewGuid().ToString();
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1); // Token hết hạn sau 1h

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        // 3. Gửi email (async, không chờ)
        _ = Task.Run(async () =>
        {
            try
            {
                var resetLink = $"{_configuration["AppSettings:FrontendUrl"]}/reset-password?token={resetToken}";
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
        // 1. Tìm user có token này
        var user = await _userRepository.GetUserByPasswordResetTokenAsync(resetPasswordDto.Token);

        if (user == null)
        {
            throw new BadRequestException("Token reset password không hợp lệ");
        }

        // 2. Kiểm tra token đã hết hạn chưa
        if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
        {
            throw new BadRequestException("Token reset password đã hết hạn");
        }

        // 3. Hash password mới và cập nhật
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(resetPasswordDto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();

        // 4. Vô hiệu hóa tất cả refresh tokens cũ (force logout all devices)
        var refreshTokens = await _refreshTokenRepository.GetRefreshTokensByUserIdAsync(user.Id);

        foreach (var token in refreshTokens)
        {
            token.IsRevoked = true;
        }

        await _refreshTokenRepository.SaveChangesAsync();
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
    {
        // 1. Tìm user
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("Không tìm thấy user");
        }

        // 2. Verify password cũ
        if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
        {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }

        // 3. Hash và cập nhật password mới
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.UpdateUser(user);
        await _userRepository.SaveChangesAsync();
    }

    private async Task<LoginResponse> GenerateLoginResponse(User user)
    {
        // 1. Load roles nếu chưa load
        if (user.UserRoles == null || !user.UserRoles.Any())
        {
            await _userRepository.LoadUserRolesAsync(user);
        }

        // 2. Lấy danh sách roles
        var roles = user.UserRoles?.Select(ur => ur.Role.Name).ToList() ?? new List<string>();

        // 3. Tạo access token
        var accessToken = _jwtService.GenerateAccessToken(user.Id, user.Email, roles);

        // 4. Tạo refresh token
        var refreshToken = _jwtService.GenerateRefreshToken();

        // 5. Lưu refresh token vào database
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

        // 6. Tạo response
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
