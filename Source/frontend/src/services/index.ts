import apiClient from "./api";

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    fullName: string;
  }) => {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  },

  logout: async () => {
    await apiClient.post("/auth/logout");
  },
};

export const eventService = {
  getAll: async (filters?: any) => {
    const response = await apiClient.get("/events", { params: filters });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  getFeatured: async () => {
    const response = await apiClient.get("/events/featured");
    return response.data;
  },
};

export const bookingService = {
  create: async (bookingData: any) => {
    const response = await apiClient.post("/bookings", bookingData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await apiClient.get("/bookings");
    return response.data;
  },
};
