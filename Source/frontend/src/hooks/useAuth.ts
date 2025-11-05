import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services";
import { useState } from "react";

export const useAuth = () => {
  const {
    token,
    user,
    isAuthenticated,
    login: setAuth,
    logout: clearAuth,
  } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password);
      setAuth(response.token, response.user);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Đăng nhập thất bại";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    fullName: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);
      setAuth(response.token, response.user);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuth();
    }
  };

  return {
    token,
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
  };
};
