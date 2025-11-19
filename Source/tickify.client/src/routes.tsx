import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import PaymentReturn from "./pages/PaymentReturn";

export function AppRoutes() {
  // Map URL paths to page names
  const pageRoutes = [
    { path: "/", page: "home" },
    { path: "/home", page: "home" },
    { path: "/listing", page: "listing" },
    { path: "/event/:eventId", page: "event-detail" },
    { path: "/cart", page: "cart" },
    { path: "/checkout", page: "checkout" },
    { path: "/success", page: "success" },
    { path: "/my-tickets", page: "my-tickets" },
    { path: "/order/:orderId", page: "order-detail" },
    { path: "/ticket/:ticketId", page: "ticket-detail" },
    { path: "/transfer-ticket/:ticketId", page: "transfer-ticket" },
    { path: "/wishlist", page: "wishlist" },
    { path: "/waitlist", page: "waitlist" },
    { path: "/organizer-wizard", page: "organizer-wizard" },
    { path: "/organizer-dashboard", page: "organizer-dashboard" },
    { path: "/event-management", page: "event-management" },
    { path: "/event-analytics/:eventId", page: "event-analytics" },
    { path: "/edit-event", page: "edit-event" },
    { path: "/scan-history", page: "scan-history" },
    { path: "/promo-codes", page: "promo-codes" },
    { path: "/notifications", page: "notifications" },
    { path: "/notification-preferences", page: "notification-preferences" },
    { path: "/reset-password", page: "reset-password" },
    { path: "/user-profile", page: "user-profile" },
    { path: "/seat-selection", page: "seat-selection" },
    { path: "/seat-map-builder", page: "seat-map-builder" },
    { path: "/review-submission", page: "review-submission" },
    { path: "/qr-scanner", page: "qr-scanner" },
    { path: "/email-verification", page: "email-verification" },
    { path: "/password-change", page: "password-change" },
    { path: "/event-reviews", page: "event-reviews" },
    { path: "/refund-request", page: "refund-request" },
    { path: "/admin-dashboard", page: "admin-dashboard" },
    { path: "/login", page: "login" },
    { path: "/register", page: "register" },
    { path: "/forgot-password", page: "forgot-password" },
  ];

  return (
    <Routes>
      {pageRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<App initialPage={route.page} />}
        />
      ))}
      <Route path="/payment/return" element={<PaymentReturn />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
