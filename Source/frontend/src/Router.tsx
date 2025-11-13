import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { StandaloneLayout } from "./components/StandaloneLayout";
import {
  HomeWrapper,
  EventListingWrapper,
  EventDetailWrapper,
  CartWrapper,
  CheckoutWrapper,
  SuccessWrapper,
  MyTicketsWrapper,
  OrderDetailWrapper,
  TicketDetailWrapper,
  TransferTicketWrapper,
  WishlistWrapper,
  WaitlistWrapper,
  OrganizerWizardWrapper,
  OrganizerDashboardWrapper,
  EventManagementWrapper,
  EventAnalyticsWrapper,
  EditEventWrapper,
  ScanHistoryWrapper,
  PromoCodeManagementWrapper,
  NotificationsWrapper,
  NotificationPreferencesWrapper,
  ResetPasswordWrapper,
  UserProfileWrapper,
  SeatSelectionWrapper,
  ReviewSubmissionWrapper,
  QRScannerWrapper,
  EmailVerificationWrapper,
  PasswordChangeWrapper,
  EventReviewsWrapper,
  RefundRequestWrapper,
  AdminDashboardWrapper,
  LoginWrapper,
  RegisterWrapper,
  ForgotPasswordWrapper,
} from "./components/PageWrappers";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // Public Pages
      { index: true, element: <HomeWrapper /> },
      { path: "listing", element: <EventListingWrapper /> },
      { path: "event-detail/:id", element: <EventDetailWrapper /> },
      { path: "cart", element: <CartWrapper /> },
      { path: "checkout", element: <CheckoutWrapper /> },
      { path: "success", element: <SuccessWrapper /> },
      { path: "wishlist", element: <WishlistWrapper /> },
      { path: "waitlist", element: <WaitlistWrapper /> },

      // Ticket Pages
      { path: "my-tickets", element: <MyTicketsWrapper /> },
      { path: "order-detail/:orderId", element: <OrderDetailWrapper /> },
      { path: "ticket-detail/:ticketId", element: <TicketDetailWrapper /> },
      { path: "transfer-ticket/:ticketId", element: <TransferTicketWrapper /> },
      { path: "seat-selection", element: <SeatSelectionWrapper /> },

      // User Profile
      { path: "user-profile", element: <UserProfileWrapper /> },
      { path: "password-change", element: <PasswordChangeWrapper /> },
      { path: "notifications", element: <NotificationsWrapper /> },
      {
        path: "notification-preferences",
        element: <NotificationPreferencesWrapper />,
      },

      // Organizer Pages
      { path: "organizer-wizard", element: <OrganizerWizardWrapper /> },
      { path: "organizer-dashboard", element: <OrganizerDashboardWrapper /> },
      { path: "event-management", element: <EventManagementWrapper /> },
      { path: "edit-event", element: <EditEventWrapper /> },
      { path: "event-analytics/:eventId", element: <EventAnalyticsWrapper /> },
      { path: "promo-codes", element: <PromoCodeManagementWrapper /> },
      { path: "qr-scanner", element: <QRScannerWrapper /> },
      { path: "scan-history", element: <ScanHistoryWrapper /> },

      // Admin
      { path: "admin-dashboard", element: <AdminDashboardWrapper /> },

      // Review & Feedback
      { path: "review-submission", element: <ReviewSubmissionWrapper /> },
      { path: "event-reviews", element: <EventReviewsWrapper /> },
      { path: "refund-request", element: <RefundRequestWrapper /> },
    ],
  },
  // Standalone Pages (no header/footer)
  {
    element: <StandaloneLayout />,
    children: [
      { path: "login", element: <LoginWrapper /> },
      { path: "register", element: <RegisterWrapper /> },
      { path: "forgot-password", element: <ForgotPasswordWrapper /> },
      { path: "reset-password", element: <ResetPasswordWrapper /> },
      { path: "email-verification", element: <EmailVerificationWrapper /> },
    ],
  },
  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);
