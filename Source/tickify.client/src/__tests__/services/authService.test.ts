import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../../services/authService';
import apiClient from '../../services/apiClient';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../services/apiClient');
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    
    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
        confirmPassword: 'Password123!',
      };

      vi.mocked(apiClient.post).mockResolvedValue({} as any);

      // Act
      await authService.register(registerDto);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerDto);
    });
  });

  describe('login', () => {
    it('should login user and save tokens to localStorage', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockLoginResponse = {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['User'],
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockLoginResponse,
      } as any);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(result).toEqual(mockLoginResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', expect.any(String));
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginDto);
    });

    it('should throw error when login response is invalid', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const invalidResponse = {
        userId: 1,
        // Missing accessToken and email
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: invalidResponse,
      } as any);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow();
      expect(toast.error).toHaveBeenCalled();
    });

    it('should redirect to saved URL after login', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const redirectUrl = '/dashboard';
      vi.mocked(sessionStorage.getItem).mockReturnValue(redirectUrl);

      const mockLoginResponse = {
        userId: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['User'],
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockLoginResponse,
      } as any);

      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
        configurable: true,
      });

      // Act
      await authService.login(loginDto);

      // Assert
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('redirectAfterLogin');
    });
  });

  describe('logout', () => {
    it('should clear localStorage and redirect to login', async () => {
      // Arrange
      const refreshToken = 'test-refresh-token';
      vi.mocked(localStorage.getItem).mockReturnValue(refreshToken);
      vi.mocked(apiClient.post).mockResolvedValue({} as any);

      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
        configurable: true,
      });

      // Act
      await authService.logout();

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', { refreshToken });
    });

    it('should continue logout even if API call fails', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockRejectedValue(new Error('API Error'));

      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
        configurable: true,
      });

      // Act
      await authService.logout();

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      // Arrange
      const user = {
        userId: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'User',
        isEmailVerified: true,
      };

      // Mock localStorage.getItem to return user for 'user' key and null for 'authToken'
      vi.mocked(localStorage.getItem).mockImplementation((key) => {
        if (key === 'user') return JSON.stringify(user);
        return null; // Return null for authToken to avoid JWT parsing
      });

      // Act
      const result = authService.getCurrentUser();

      // Assert
      expect(result).toEqual(user);
    });

    it('should return null when no user in localStorage', () => {
      // Arrange
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      // Act
      const result = authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      // Arrange
      vi.mocked(localStorage.getItem).mockReturnValue('test-token');

      // Act
      const result = authService.isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when no token', () => {
      // Arrange
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      // Act
      const result = authService.isAuthenticated();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', () => {
      // Arrange
      const user = {
        userId: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'Admin',
        isEmailVerified: true,
      };

      vi.mocked(localStorage.getItem).mockImplementation((key) => {
        if (key === 'user') return JSON.stringify(user);
        return null; // Return null for authToken to avoid JWT parsing
      });

      // Act
      const result = authService.hasRole('Admin');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have role', () => {
      // Arrange
      const user = {
        userId: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'User',
        isEmailVerified: true,
      };

      vi.mocked(localStorage.getItem).mockImplementation((key) => {
        if (key === 'user') return JSON.stringify(user);
        return null; // Return null for authToken to avoid JWT parsing
      });

      // Act
      const result = authService.hasRole('Admin');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and update localStorage', async () => {
      // Arrange
      const oldRefreshToken = 'old-refresh-token';
      const newToken = 'new-access-token';

      vi.mocked(localStorage.getItem).mockReturnValue(oldRefreshToken);

      // authService.refreshToken returns data.token, not data.accessToken
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { token: newToken },
      } as any);

      // Act
      const result = await authService.refreshToken();

      // Assert
      expect(result).toBe(newToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh-token');
    });
  });

  describe('forgotPassword', () => {
    it('should call forgot password API', async () => {
      // Arrange
      const email = 'test@example.com';
      vi.mocked(apiClient.post).mockResolvedValue({} as any);

      // Act
      await authService.forgotPassword(email);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email });
    });
  });

  describe('resetPassword', () => {
    it('should call reset password API', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'reset-token';
      const newPassword = 'NewPassword123!';
      const confirmPassword = 'NewPassword123!';

      vi.mocked(apiClient.post).mockResolvedValue({} as any);

      // Act
      await authService.resetPassword(email, token, newPassword, confirmPassword);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        email,
        token,
        newPassword,
        confirmPassword,
      });
    });
  });
});
