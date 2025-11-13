import { useNavigate } from "react-router-dom";

/**
 * Hook to adapt React Router's useNavigate to match the old onNavigate signature
 * This allows us to use React Router without refactoring all components
 */
export function useNavigateAdapter() {
  const navigate = useNavigate();

  const handleNavigate = (page: string, id?: string) => {
    // Map old page names to new URL paths
    const routes: Record<string, string> = {
      home: "/",
      listing: "/listing",
      "event-detail": id ? `/event-detail/${id}` : "/listing",
      cart: "/cart",
      checkout: "/checkout",
      success: "/success",
      "my-tickets": "/my-tickets",
      "order-detail": id ? `/order-detail/${id}` : "/my-tickets",
      "ticket-detail": id ? `/ticket-detail/${id}` : "/my-tickets",
      "transfer-ticket": id ? `/transfer-ticket/${id}` : "/my-tickets",
      wishlist: "/wishlist",
      waitlist: "/waitlist",
      "seat-selection": "/seat-selection",
      "organizer-wizard": "/organizer-wizard",
      "organizer-dashboard": "/organizer-dashboard",
      "event-management": "/event-management",
      "event-analytics": id ? `/event-analytics/${id}` : "/organizer-dashboard",
      "edit-event": "/edit-event",
      "scan-history": "/scan-history",
      "promo-codes": "/promo-codes",
      "qr-scanner": "/qr-scanner",
      notifications: "/notifications",
      "notification-preferences": "/notification-preferences",
      "reset-password": "/reset-password",
      "user-profile": "/user-profile",
      "review-submission": "/review-submission",
      "event-reviews": "/event-reviews",
      "refund-request": "/refund-request",
      "admin-dashboard": "/admin-dashboard",
      login: "/login",
      register: "/register",
      "forgot-password": "/forgot-password",
      "email-verification": "/email-verification",
      "password-change": "/password-change",
    };

    const path = routes[page] || "/";
    navigate(path);
    window.scrollTo(0, 0);
  };

  return { handleNavigate };
}
