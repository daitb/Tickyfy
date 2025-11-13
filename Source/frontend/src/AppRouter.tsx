import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/home" element={<App />} />
      <Route path="/listing" element={<App initialPage="listing" />} />
      <Route
        path="/event/:eventId"
        element={<App initialPage="event-detail" />}
      />
      <Route path="/cart" element={<App initialPage="cart" />} />
      <Route path="/checkout" element={<App initialPage="checkout" />} />
      <Route path="/success" element={<App initialPage="success" />} />
      <Route path="/my-tickets" element={<App initialPage="my-tickets" />} />
      <Route
        path="/order/:orderId"
        element={<App initialPage="order-detail" />}
      />
      <Route
        path="/ticket/:ticketId"
        element={<App initialPage="ticket-detail" />}
      />
      <Route
        path="/transfer-ticket/:ticketId"
        element={<App initialPage="transfer-ticket" />}
      />
      <Route path="/wishlist" element={<App initialPage="wishlist" />} />
      <Route path="/waitlist" element={<App initialPage="waitlist" />} />
      <Route
        path="/organizer-wizard"
        element={<App initialPage="organizer-wizard" />}
      />
      <Route
        path="/organizer-dashboard"
        element={<App initialPage="organizer-dashboard" />}
      />
      <Route
        path="/event-management"
        element={<App initialPage="event-management" />}
      />
      <Route
        path="/event-analytics/:eventId"
        element={<App initialPage="event-analytics" />}
      />
      <Route path="/edit-event" element={<App initialPage="edit-event" />} />
      <Route
        path="/scan-history"
        element={<App initialPage="scan-history" />}
      />
      <Route path="/promo-codes" element={<App initialPage="promo-codes" />} />
      <Route
        path="/notifications"
        element={<App initialPage="notifications" />}
      />
      <Route
        path="/notification-preferences"
        element={<App initialPage="notification-preferences" />}
      />
      <Route
        path="/reset-password"
        element={<App initialPage="reset-password" />}
      />
      <Route
        path="/user-profile"
        element={<App initialPage="user-profile" />}
      />
      <Route
        path="/seat-selection"
        element={<App initialPage="seat-selection" />}
      />
      <Route
        path="/seat-map-builder"
        element={<App initialPage="seat-map-builder" />}
      />
      <Route
        path="/review-submission"
        element={<App initialPage="review-submission" />}
      />
      <Route path="/qr-scanner" element={<App initialPage="qr-scanner" />} />
      <Route
        path="/email-verification"
        element={<App initialPage="email-verification" />}
      />
      <Route
        path="/password-change"
        element={<App initialPage="password-change" />}
      />
      <Route
        path="/event-reviews"
        element={<App initialPage="event-reviews" />}
      />
      <Route
        path="/refund-request"
        element={<App initialPage="refund-request" />}
      />
      <Route
        path="/admin-dashboard"
        element={<App initialPage="admin-dashboard" />}
      />
      <Route path="/login" element={<App initialPage="login" />} />
      <Route path="/register" element={<App initialPage="register" />} />
      <Route
        path="/forgot-password"
        element={<App initialPage="forgot-password" />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
