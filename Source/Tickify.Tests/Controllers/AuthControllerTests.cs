using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Tickify.Common;
using Tickify.Controllers;
using Tickify.DTOs.Auth;
using Tickify.Services.Auth;
using Xunit;

namespace Tickify.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _mockAuthService;
    private readonly Mock<ILogger<AuthController>> _mockLogger;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockAuthService = new Mock<IAuthService>();
        _mockLogger = new Mock<ILogger<AuthController>>();
        _controller = new AuthController(_mockAuthService.Object, _mockLogger.Object);
    }

    #region Register Tests

    [Fact]
    public async Task Register_WithValidData_ReturnsOkResult()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "test@example.com",
            Password = "Test@123",
            ConfirmPassword = "Test@123",
            FullName = "Test User"
        };

        _mockAuthService
            .Setup(s => s.RegisterAsync(It.IsAny<RegisterDto>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.Register(registerDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult!.Value.Should().BeOfType<ApiResponse<object>>();
        
        var response = okResult.Value as ApiResponse<object>;
        response!.Success.Should().BeTrue();
        response.Message.Should().Contain("Đăng ký thành công");

        _mockAuthService.Verify(s => s.RegisterAsync(registerDto), Times.Once);
    }

    [Fact]
    public async Task Register_WithInvalidData_ThrowsException()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "invalid-email",
            Password = "weak",
            ConfirmPassword = "different",
            FullName = ""
        };

        _mockAuthService
            .Setup(s => s.RegisterAsync(It.IsAny<RegisterDto>()))
            .ThrowsAsync(new Exception("Validation failed"));

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _controller.Register(registerDto));
    }

    #endregion

    #region Login Tests

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkWithToken()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "test@example.com",
            Password = "Test@123"
        };

        var loginResponse = new LoginResponse
        {
            Token = "test-token",
            RefreshToken = "refresh-token",
            UserId = 1,
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            Roles = new List<string> { "Customer" }
        };

        _mockAuthService
            .Setup(s => s.LoginAsync(It.IsAny<LoginDto>()))
            .ReturnsAsync(loginResponse);

        // Act
        var result = await _controller.Login(loginDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<LoginResponse>;
        
        response!.Success.Should().BeTrue();
        response.Data.Should().NotBeNull();
        response.Data!.AccessToken.Should().Be("test-token");
        response.Data.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ThrowsException()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "test@example.com",
            Password = "WrongPassword"
        };

        _mockAuthService
            .Setup(s => s.LoginAsync(It.IsAny<LoginDto>()))
            .ThrowsAsync(new UnauthorizedAccessException("Invalid credentials"));

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _controller.Login(loginDto));
    }

    #endregion

    #region RefreshToken Tests

    [Fact]
    public async Task RefreshToken_WithValidToken_ReturnsNewToken()
    {
        // Arrange
        var refreshTokenDto = new RefreshTokenDto
        {
            RefreshToken = "valid-refresh-token"
        };

        var loginResponse = new LoginResponse
        {
            AccessToken = "new-token",
            RefreshToken = "new-refresh-token",
            UserId = 1,
            Email = "test@example.com",
            FullName = "Test User",
            Roles = new List<string> { "Customer" },
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        _mockAuthService
            .Setup(s => s.RefreshTokenAsync(It.IsAny<RefreshTokenDto>()))
            .ReturnsAsync(loginResponse);

        // Act
        var result = await _controller.RefreshToken(refreshTokenDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<LoginResponse>;
        
        response!.Success.Should().BeTrue();
        response.Data!.AccessToken.Should().Be("new-token");
    }

    #endregion

    #region Logout Tests

    [Fact]
    public async Task Logout_WithValidUser_ReturnsOk()
    {
        // Arrange
        var userId = 1;
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var refreshTokenDto = new RefreshTokenDto
        {
            RefreshToken = "refresh-token"
        };

        _mockAuthService
            .Setup(s => s.LogoutAsync(userId, It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.Logout(refreshTokenDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockAuthService.Verify(s => s.LogoutAsync(userId, refreshTokenDto.RefreshToken), Times.Once);
    }

    #endregion

    #region VerifyEmail Tests

    [Fact]
    public async Task VerifyEmail_WithValidToken_ReturnsOk()
    {
        // Arrange
        var verifyDto = new VerifyEmailDto
        {
            Token = "valid-token"
        };

        _mockAuthService
            .Setup(s => s.VerifyEmailAsync(It.IsAny<VerifyEmailDto>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.VerifyEmail(verifyDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<object>;
        
        response!.Success.Should().BeTrue();
        response.Message.Should().Contain("Xác thực email thành công");
    }

    #endregion

    #region ForgotPassword Tests

    [Fact]
    public async Task ForgotPassword_WithValidEmail_ReturnsOk()
    {
        // Arrange
        var forgotPasswordDto = new ForgotPasswordDto
        {
            Email = "test@example.com"
        };

        _mockAuthService
            .Setup(s => s.ForgotPasswordAsync(It.IsAny<ForgotPasswordDto>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ForgotPassword(forgotPasswordDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<object>;
        
        response!.Success.Should().BeTrue();
    }

    #endregion

    #region ResetPassword Tests

    [Fact]
    public async Task ResetPassword_WithValidData_ReturnsOk()
    {
        // Arrange
        var resetPasswordDto = new ResetPasswordDto
        {
            Token = "valid-token",
            NewPassword = "NewPassword@123"
        };

        _mockAuthService
            .Setup(s => s.ResetPasswordAsync(It.IsAny<ResetPasswordDto>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ResetPassword(resetPasswordDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockAuthService.Verify(s => s.ResetPasswordAsync(resetPasswordDto), Times.Once);
    }

    #endregion

    #region ChangePassword Tests

    [Fact]
    public async Task ChangePassword_WithValidData_ReturnsOk()
    {
        // Arrange
        var userId = 1;
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var changePasswordDto = new ChangePasswordDto
        {
            CurrentPassword = "OldPassword@123",
            NewPassword = "NewPassword@123"
        };

        _mockAuthService
            .Setup(s => s.ChangePasswordAsync(userId, It.IsAny<ChangePasswordDto>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ChangePassword(changePasswordDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockAuthService.Verify(s => s.ChangePasswordAsync(userId, changePasswordDto), Times.Once);
    }

    #endregion

    #region ExternalLogin Tests

    [Fact]
    public async Task ExternalLogin_WithGoogle_ReturnsOkWithToken()
    {
        // Arrange
        var externalLoginDto = new ExternalLoginDto
        {
            Provider = "Google",
            Email = "test@example.com",
            FullName = "Test User",
            ProviderId = "google-123"
        };

        var loginResponse = new LoginResponse
        {
            AccessToken = "test-token",
            RefreshToken = "refresh-token",
            UserId = 1,
            Email = "test@example.com",
            FullName = "Test User",
            Roles = new List<string> { "Customer" },
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        _mockAuthService
            .Setup(s => s.ExternalLoginAsync(It.IsAny<ExternalLoginDto>()))
            .ReturnsAsync(loginResponse);

        // Act
        var result = await _controller.ExternalLogin(externalLoginDto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var response = okResult!.Value as ApiResponse<LoginResponse>;
        
        response!.Success.Should().BeTrue();
        response.Data.Should().NotBeNull();
        response.Message.Should().Contain("Google");
    }

    #endregion
}
