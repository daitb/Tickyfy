// API Base URL
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Routes
export const ROUTES = {
  HOME: "/",
  EVENTS: "/events",
  EVENT_DETAIL: (id: string | number) => `/events/${id}`,
  CART: "/cart",
  CHECKOUT: "/checkout",
  SUCCESS: "/success",
  MY_TICKETS: "/my-tickets",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  ORGANIZER_WIZARD: "/organizer/wizard",
  ORGANIZER_DASHBOARD: "/organizer/dashboard",
} as const;
