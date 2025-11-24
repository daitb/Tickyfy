import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UserDto {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  isEmailVerified: boolean;
  organizerId?: number;
}

// Backend actual response structure
export interface LoginResponse {
  userId: number;
  email: string;
  fullName: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// ===== AUTH SERVICE =====
class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<void> {
    await apiClient.post("/auth/register", data);
  }

  /**
   * Login user and save token + user info to localStorage
   */
  async login(data: LoginDto): Promise<LoginResponse> {
    console.log("AuthService.login - Sending request:", data);

    const response = await apiClient.post<LoginResponse>("/auth/login", data);

    console.log("AuthService.login - Raw response:", response);
    console.log("AuthService.login - Response data:", response.data);

    const loginResponse = response.data;

    // Check if loginResponse is valid (backend returns flat structure)
    if (!loginResponse || !loginResponse.accessToken || !loginResponse.email) {
      console.error("Invalid login response structure:", loginResponse);
      throw new Error("Invalid response from server");
    }

    // Save to localStorage (backend uses accessToken, not token)
    localStorage.setItem("authToken", loginResponse.accessToken);

    // Convert backend response to UserDto format for compatibility
    const user: UserDto = {
      userId: loginResponse.userId.toString(),
      fullName: loginResponse.fullName,
      email: loginResponse.email,
      role: loginResponse.roles[0], // Take first role
      isEmailVerified: true,
    };

    localStorage.setItem("user", JSON.stringify(user));

    console.log("AuthService.login - Token saved:", loginResponse.accessToken);
    console.log("AuthService.login - User saved:", user);

    // Dispatch custom event to notify app of auth change
    window.dispatchEvent(new Event("auth-change"));

    // Check for redirect URL and redirect after successful login
    const redirectUrl = sessionStorage.getItem("redirectAfterLogin");
    if (redirectUrl) {
      sessionStorage.removeItem("redirectAfterLogin");
      // Use setTimeout to ensure state updates complete
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);
    }

    return loginResponse;
  }

  /**
   * Logout user - clear localStorage and redirect
   */
  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    // Dispatch custom event to notify app of auth change
    window.dispatchEvent(new Event("auth-change"));

    window.location.href = "/login";
  }

  /**
   * Get current logged-in user from localStorage
   */
  getCurrentUser(): UserDto | null {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as UserDto;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem("authToken");
    return !!token;
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ token: string }>(
      "/auth/refresh-token"
    );
    const newToken = response.data.token;

    localStorage.setItem("authToken", newToken);
    return newToken;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string, email?: string): Promise<void> {
    // Backend expects { email, token }
    // If email is not provided, try to get it from user or let backend handle it
    const payload = email ? { email, token } : { token, email: '' };
    await apiClient.post("/auth/verify-email", payload);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(email: string, token: string, newPassword: string, confirmPassword: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { email, token, newPassword, confirmPassword });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await apiClient.post("/auth/change-password", { currentPassword, newPassword, confirmPassword });
  }

    /**
   * Google Login - External authentication
   */
  async googleLogin(credential: string): Promise<LoginResponse> {
    console.log("AuthService.googleLogin - Sending Google credential");

    // Decode JWT token to get user info
    const payload = JSON.parse(atob(credential.split('.')[1]));
    
    const externalLoginDto = {
      provider: "Google",
      idToken: credential,
      email: payload.email,
      fullName: payload.name,
      providerId: payload.sub,
      profilePicture: payload.picture
    };

    const response = await apiClient.post<LoginResponse>("/auth/external-login", externalLoginDto);

    console.log("AuthService.googleLogin - Response:", response.data);

    const loginResponse = response.data;

    // Check if loginResponse is valid
    if (!loginResponse || !loginResponse.accessToken || !loginResponse.email) {
      console.error("Invalid login response structure:", loginResponse);
      throw new Error("Invalid response from server");
    }

    // Save to localStorage
    localStorage.setItem("authToken", loginResponse.accessToken);

    // Convert backend response to UserDto format
    const user: UserDto = {
      userId: loginResponse.userId.toString(),
      fullName: loginResponse.fullName,
      email: loginResponse.email,
      role: loginResponse.roles[0],
      isEmailVerified: true,
    };

    localStorage.setItem("user", JSON.stringify(user));

    console.log("AuthService.googleLogin - Login successful");

    // Dispatch custom event to notify app of auth change
    window.dispatchEvent(new Event("auth-change"));

    return loginResponse;
  }
}

export const authService = new AuthService();
