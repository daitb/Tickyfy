import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from "axios";
import { toast } from "sonner";

// Base API URL
const API_BASE_URL = "http://localhost:5179/api";

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("authToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors, auto-refresh token, and extract data from ApiResponse wrapper
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Backend wraps responses in ApiResponse<T> with { success, message, data }
    // Extract the data field if it exists
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only log errors, not all requests
    if (error.response?.status && error.response.status >= 400) {
      console.error(
        `API Error [${error.response.status}]:`,
        error.config?.url,
        error.response?.data || error.message
      );
      // Log full error details for debugging
      if (error.response?.data) {
        console.error(
          "Error details:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
    }

    // Handle 401 Unauthorized - attempt to refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      const refreshToken = localStorage.getItem("refreshToken");

      // If no refresh token, redirect to login
      if (!refreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token endpoint
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        // Backend wraps response in ApiResponse, extract data
        const data = response.data?.data || response.data;
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        // Update tokens in localStorage
        localStorage.setItem("authToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Update user info if provided
        if (data.userId && data.email && data.fullName && data.roles) {
          const user = {
            userId: data.userId.toString(),
            fullName: data.fullName,
            email: data.email,
            role: data.roles[0],
            isEmailVerified: true,
            organizerId: data.organizerId,
          };
          localStorage.setItem("user", JSON.stringify(user));
        }

        // Process queued requests with new token
        processQueue(null, newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      toast.error("Bạn không có quyền truy cập tài nguyên này.");
    } else if (error.response?.status === 404) {
      // 404 errors are usually handled by pages, don't show toast here
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error("Lỗi máy chủ. Vui lòng thử lại sau.");
    }

    return Promise.reject(error);
  }
);

// Helper function to clear auth data and redirect to login
function clearAuthAndRedirect() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  window.location.href = "/login";
}

export default apiClient;
