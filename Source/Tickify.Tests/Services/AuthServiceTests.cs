using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using Tickify.DTOs.Auth;
using Tickify.Exceptions;
using Tickify.Interfaces.Repositories;
using Tickify.Models;
using Tickify.Repositories;
using Tickify.Services.Auth;
using Tickify.Services.Email;
using Xunit;

namespace Tickify.Tests.Services;

/// <summary>
/// Unit tests cho AuthService
/// </summary>
public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<IRoleRepository> _mockRoleRepository;
    private readonly Mock<IUserRoleRepository> _mockUserRoleRepository;
    private readonly Mock<IRefreshTokenRepository> _mockRefreshTokenRepository;
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _mockUserRepository = new Mock<IUserRepository>();
        _mockRoleRepository = new Mock<IRoleRepository>();
        _mockUserRoleRepository = new Mock<IUserRoleRepository>();
        _mockRefreshTokenRepository = new Mock<IRefreshTokenRepository>();
        _mockJwtService = new Mock<IJwtService>();
        _mockEmailService = new Mock<IEmailService>();
        _mockConfiguration = new Mock<IConfiguration>();

        _authService = new AuthService(
            _mockUserRepository.Object,
            _mockRoleRepository.Object,
            _mockUserRoleRepository.Object,
            _mockRefreshTokenRepository.Object,
            _mockJwtService.Object,
            _mockEmailService.Object,
            _mockConfiguration.Object
        );
    }

    #region RegisterAsync Tests

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldCreateUser()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "test@example.com",
            Password = "Password123!",
            FullName = "Test User"
        };

        _mockUserRepository
            .Setup(r => r.GetUserByEmailAsync(registerDto.Email))
            .ReturnsAsync((User?)null);

        var userRole = new Role
        {
            Id = 1,
            Name = "User"
        };

        _mockRoleRepository
            .Setup(r => r.GetRoleByNameAsync("User"))
            .ReturnsAsync(userRole);

        _mockUserRepository
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        _mockUserRepository
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _mockConfiguration
            .Setup(c => c["AppSettings:FrontendUrl"])
            .Returns("https://test.com");

        // Act
        await _authService.RegisterAsync(registerDto);

        // Assert
        _mockUserRepository.Verify(r => r.GetUserByEmailAsync(registerDto.Email), Times.Once);
        _mockUserRepository.Verify(r => r.AddUserAsync(It.Is<User>(u =>
            u.Email == registerDto.Email.ToLower() &&
            u.FullName == registerDto.FullName &&
            !string.IsNullOrEmpty(u.PasswordHash) &&
            !u.IsEmailVerified &&
            !string.IsNullOrEmpty(u.EmailVerificationToken)
        )), Times.Once);
        _mockUserRepository.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ShouldThrowBadRequestException()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "existing@example.com",
            Password = "Password123!",
            FullName = "Test User"
        };

        var existingUser = new User
        {
            Id = 1,
            Email = registerDto.Email,
            FullName = "Existing User"
        };

        _mockUserRepository
            .Setup(r => r.GetUserByEmailAsync(registerDto.Email))
            .ReturnsAsync(existingUser);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => _authService.RegisterAsync(registerDto));
    }

    #endregion

    #region LoginAsync Tests

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnLoginResponse()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(loginDto.Password);
        var user = new User
        {
            Id = 1,
            Email = loginDto.Email,
            PasswordHash = passwordHash,
            FullName = "Test User",
            IsActive = true,
            IsEmailVerified = true
        };

        var userRole = new Role
        {
            Id = 1,
            Name = "User"
        };

        var userRoles = new List<UserRole>
        {
            new UserRole
            {
                UserId = user.Id,
                RoleId = userRole.Id,
                Role = userRole
            }
        };

        user.UserRoles = userRoles;

        _mockUserRepository
            .Setup(r => r.GetUserByEmailAsync(loginDto.Email))
            .ReturnsAsync(user);

        _mockUserRepository
            .Setup(r => r.LoadUserRolesAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask)
            .Callback<User>(u => u.UserRoles = userRoles);

        _mockUserRepository
            .Setup(r => r.GetOrganizerByUserIdAsync(user.Id))
            .ReturnsAsync((Organizer?)null);

        _mockJwtService
            .Setup(j => j.GenerateAccessToken(
                user.Id,
                user.Email,
                It.IsAny<IList<string>>(),
                It.IsAny<int?>()))
            .Returns("access-token");

        _mockJwtService
            .Setup(j => j.GenerateRefreshToken())
            .Returns("refresh-token");

        _mockRefreshTokenRepository
            .Setup(r => r.AddRefreshTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _mockRefreshTokenRepository
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _mockConfiguration
            .Setup(c => c["JwtSettings:ExpiryInMinutes"])
            .Returns("60");

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("refresh-token");
        result.Email.Should().Be(loginDto.Email);
        _mockUserRepository.Verify(r => r.GetUserByEmailAsync(loginDto.Email), Times.Once);
        _mockJwtService.Verify(j => j.GenerateAccessToken(
            It.IsAny<int>(),
            It.IsAny<string>(),
            It.IsAny<IList<string>>(),
            It.IsAny<int?>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidEmail_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "nonexistent@example.com",
            Password = "Password123!"
        };

        _mockUserRepository
            .Setup(r => r.GetUserByEmailAsync(loginDto.Email))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(
            () => _authService.LoginAsync(loginDto));
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "test@example.com",
            Password = "WrongPassword"
        };

        var user = new User
        {
            Id = 1,
            Email = loginDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword"),
            IsActive = true,
            IsEmailVerified = true
        };

        _mockUserRepository
            .Setup(r => r.GetUserByEmailAsync(loginDto.Email))
            .ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(
            () => _authService.LoginAsync(loginDto));
    }

    [Fact]
    public async Task LoginAsync_WithUnverifiedEmail_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(loginDto.Password);
        var user = new User
        {
            Id = 1,
            Email = loginDto.Email,
            PasswordHash = passwordHash,
            IsActive = true,
            IsEmailVerified = false // Email chưa được verify
        };

        _mockUserRepository
            .Setup(r => r.GetUserByEmailAsync(loginDto.Email))
            .ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(
            () => _authService.LoginAsync(loginDto));
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(loginDto.Password);
        var user = new User
        {
            Id = 1,
            Email = loginDto.Email,
            PasswordHash = passwordHash,
            IsActive = false, // User không active
            IsEmailVerified = true
        };

        _mockUserRepository
            .Setup(r => r.GetUserByEmailAsync(loginDto.Email))
            .ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(
            () => _authService.LoginAsync(loginDto));
    }

    #endregion
}

