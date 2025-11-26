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
  organizerId?: number | null;
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
    await apiClient.post("/Auth/register", data);
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
    localStorage.setItem("refreshToken", loginResponse.refreshToken);

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

    this.handlePendingRedirect();

    return loginResponse;
  }

  /**
   * Logout user - call backend API, clear localStorage and redirect
   */
  async logout(): Promise<void> {
    try {
      // Get refresh token from localStorage if stored, or use empty string
      const refreshToken = localStorage.getItem("refreshToken") || "";

      // Call backend logout to revoke refresh token
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with logout even if API call fails
    } finally {
      // Clear all auth data from localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Dispatch custom event to notify app of auth change
      window.dispatchEvent(new Event("auth-change"));

      window.location.href = "/login";
    }
  }

  /**
   * Get current logged-in user from localStorage
   */
  getCurrentUser(): UserDto | null {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      const parsed = JSON.parse(userStr) as UserDto;
      if (
        parsed &&
        (parsed.organizerId === undefined || parsed.organizerId === null)
      ) {
        const organizerId = this.getOrganizerIdFromToken(
          localStorage.getItem("authToken") || undefined
        );
        if (organizerId) {
          parsed.organizerId = organizerId;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Convenience accessor for the organizer id of current user
   */
  getCurrentOrganizerId(): number | undefined {
    const user = this.getCurrentUser();
    if (user?.organizerId) {
      return user.organizerId;
    }
    return this.getOrganizerIdFromToken(
      localStorage.getItem("authToken") || undefined
    );
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
    const response = await apiClient.post<LoginResponse>("/auth/refresh-token");
    const loginResponse = response.data;
    const user = this.persistAuthenticatedUser(loginResponse);
    console.log("AuthService.refreshToken - refreshed for user", user.userId);
    return loginResponse.accessToken;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string, email?: string): Promise<void> {
    // Backend expects { email, token }
    // If email is not provided, try to get it from user or let backend handle it
    const payload = email ? { email, token } : { token, email: "" };
    await apiClient.post("/Auth/verify-email", payload);
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    await apiClient.post("/auth/resend-verification", { email });
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
  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    await apiClient.post("/Auth/reset-password", {
      email,
      token,
      newPassword,
      confirmPassword,
    });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    await apiClient.post("/Auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  /**
   * Google Login - External authentication
   */
  async googleLogin(credential: string): Promise<LoginResponse> {
    console.log("AuthService.googleLogin - Sending Google credential");

    // Decode JWT token to get user info
    const payload = JSON.parse(atob(credential.split(".")[1]));

    const externalLoginDto = {
      provider: "Google",
      idToken: credential,
      email: payload.email,
      fullName: payload.name,
      providerId: payload.sub,
      profilePicture: payload.picture,
    };

    const response = await apiClient.post<LoginResponse>(
      "/auth/external-login",
      externalLoginDto
    );

    console.log("AuthService.googleLogin - Response:", response.data);

    const loginResponse = response.data;

    // Check if loginResponse is valid
    if (!loginResponse || !loginResponse.accessToken || !loginResponse.email) {
      console.error("Invalid login response structure:", loginResponse);
      throw new Error("Invalid response from server");
    }

    // Save to localStorage
    localStorage.setItem("authToken", loginResponse.accessToken);
    localStorage.setItem("refreshToken", loginResponse.refreshToken);

    const user: UserDto = {
      userId: loginResponse.userId.toString(),
      fullName: loginResponse.fullName,
      email: loginResponse.email,
      role: primaryRole,
      isEmailVerified: true,
    };

    if (resolvedOrganizerId !== undefined && resolvedOrganizerId !== null) {
      user.organizerId = resolvedOrganizerId;
    }

    localStorage.setItem("authToken", loginResponse.accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    // Notify the rest of the app
    window.dispatchEvent(new Event("auth-change"));

    return user;
  }

  private handlePendingRedirect(): void {
    const redirectUrl = sessionStorage.getItem("redirectAfterLogin");
    if (redirectUrl) {
      sessionStorage.removeItem("redirectAfterLogin");
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);
    }
  }

  private getOrganizerIdFromToken(token?: string): number | undefined {
    if (!token) return undefined;
    const payload = this.parseJwt(token);
    if (!payload) return undefined;

    const raw =
      (payload["organizerId"] as string | number | undefined) ??
      (payload["organizerID"] as string | number | undefined) ??
      (payload["organizer_id"] as string | number | undefined);

    if (raw === undefined || raw === null) {
      return undefined;
    }

    const parsed = parseInt(raw.toString(), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private parseJwt(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = parts[1];
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(
        normalized.length + ((4 - (normalized.length % 4)) % 4),
        "="
      );
      const decoded = atob(padded);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch (error) {
      console.warn(
        "AuthService.parseJwt - Failed to parse token payload",
        error
      );
      return null;
    }
  }
}

export const authService = new AuthService();
