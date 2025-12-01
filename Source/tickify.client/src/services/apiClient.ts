import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from "axios";
import { toast } from "sonner";

// Base API URL
const API_BASE_URL = "http://localhost:5179/api";

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

// Response interceptor to handle common errors and extract data from ApiResponse wrapper
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
  (error: AxiosError) => {
    // Only log errors, not all requests
    if (error.response?.status && error.response.status >= 400) {
      console.error(`API Error [${error.response.status}]:`, error.config?.url, error.response?.data || error.message);
    }

    // Don't redirect on login failure (401), let the login page handle it
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      // Unauthorized - clear token and redirect to login (but NOT during login attempt)
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      toast.error("Bạn không có quyền truy cập tài nguyên này.");
    } else if (error.response?.status === 404) {
      // 404 errors are usually handled by pages, don't show toast here
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error("Lỗi máy chủ. Vui lòng thử lại sau.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
