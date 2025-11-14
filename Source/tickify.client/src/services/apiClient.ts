import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from "axios";

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
    console.log(
      "ApiClient Response Interceptor - Original response:",
      response
    );
    console.log(
      "ApiClient Response Interceptor - Response data:",
      response.data
    );

    // Backend wraps responses in ApiResponse<T> with { success, message, data }
    // Extract the data field if it exists
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      console.log("ApiClient Response Interceptor - Extracting data field");
      response.data = response.data.data;
      console.log(
        "ApiClient Response Interceptor - After extraction:",
        response.data
      );
    }
    return response;
  },
  (error: AxiosError) => {
    console.error("ApiClient Error Interceptor - Error:", error);
    console.error(
      "ApiClient Error Interceptor - Error response:",
      error.response
    );

    // Don't redirect on login failure (401), let the login page handle it
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/Auth/login")
    ) {
      // Unauthorized - clear token and redirect to login (but NOT during login attempt)
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      console.error(
        "Forbidden: You do not have permission to access this resource"
      );
    } else if (error.response?.status === 404) {
      console.error("Not Found: The requested resource does not exist");
    } else if (error.response?.status && error.response.status >= 500) {
      console.error("Server Error: Please try again later");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
