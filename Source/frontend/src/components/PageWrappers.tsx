/**
 * Wrapper components that adapt React Router to work with existing pages
 * that expect onNavigate prop. This avoids refactoring all 38 components.
 */

import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { CartItem, Order } from "../types";
import { mockOrders } from "../mockData";
import { useNavigateAdapter } from "../hooks/useNavigateAdapter";

// Import all pages
import { Home } from "../pages/Home";
import { EventListing } from "../pages/EventListing";
import { EventDetail } from "../pages/EventDetail";
import { Cart } from "../pages/Cart";
import { Checkout } from "../pages/Checkout";
import { Success } from "../pages/Success";
import { MyTickets } from "../pages/MyTickets";
import { OrderDetail } from "../pages/OrderDetail";
import { TicketDetail } from "../pages/TicketDetail";
import { TransferTicket } from "../pages/TransferTicket";
import { Wishlist } from "../pages/Wishlist";
import { Waitlist } from "../pages/Waitlist";
import { OrganizerWizard } from "../pages/OrganizerWizard";
import { OrganizerDashboard } from "../pages/OrganizerDashboard";
import { EventManagement } from "../pages/EventManagement";
import { EventAnalytics } from "../pages/EventAnalytics";
import { EditEvent } from "../pages/EditEvent";
import { ScanHistory } from "../pages/ScanHistory";
import { PromoCodeManagement } from "../pages/PromoCodeManagement";
import { Notifications } from "../pages/Notifications";
import { NotificationPreferences } from "../pages/NotificationPreferences";
import { ResetPassword } from "../pages/ResetPassword";
import { UserProfile } from "../pages/UserProfile";
import { SeatSelection } from "../pages/SeatSelection";
import { ReviewSubmission } from "../pages/ReviewSubmission";
import { QRScanner } from "../pages/QRScanner";
import { EmailVerification } from "../pages/EmailVerification";
import { PasswordChange } from "../pages/PasswordChange";
import { EventReviews } from "../pages/EventReviews";
import { RefundRequest } from "../pages/RefundRequest";
import { AdminDashboard } from "../pages/AdminDashboard";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { ForgotPassword } from "../pages/ForgotPassword";

// Global state - in a real app, use Context or Zustand
let globalCartItems: CartItem[] = [];
let globalCompletedOrders: Order[] = mockOrders;
let globalLastOrder: Order | null = null;

// Simple wrapper for pages that only need onNavigate
export function HomeWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  return <Home onNavigate={handleNavigate} isSearchOpen={isSearchOpen} />;
}

export function EventListingWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <EventListing onNavigate={handleNavigate} />;
}

export function EventDetailWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  const { id } = useParams<{ id: string }>();

  const handleAddToCart = (items: CartItem[]) => {
    globalCartItems = items;
  };

  if (!id) return null;

  return (
    <EventDetail
      eventId={id}
      onNavigate={handleNavigate}
      onAddToCart={handleAddToCart}
    />
  );
}

export function CartWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  const [cartItems, setCartItems] = useState<CartItem[]>(globalCartItems);

  return (
    <Cart
      items={cartItems}
      onNavigate={handleNavigate}
      onUpdateCart={(items) => {
        setCartItems(items);
        globalCartItems = items;
      }}
    />
  );
}

export function CheckoutWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  const navigate = useNavigate();

  const handleCompleteOrder = (order: Order) => {
    globalCompletedOrders = [...globalCompletedOrders, order];
    globalLastOrder = order;
    globalCartItems = [];
    navigate("/success");
  };

  return (
    <Checkout
      items={globalCartItems}
      onNavigate={handleNavigate}
      onCompleteOrder={handleCompleteOrder}
    />
  );
}

export function SuccessWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <Success order={globalLastOrder} onNavigate={handleNavigate} />;
}

export function MyTicketsWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return (
    <MyTickets orders={globalCompletedOrders} onNavigate={handleNavigate} />
  );
}

export function OrderDetailWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  const { orderId } = useParams<{ orderId: string }>();
  return (
    <OrderDetail
      orderId={orderId}
      orders={globalCompletedOrders}
      onNavigate={handleNavigate}
    />
  );
}

export function TicketDetailWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  const { ticketId } = useParams<{ ticketId: string }>();
  return (
    <TicketDetail
      ticketId={ticketId}
      orders={globalCompletedOrders}
      onNavigate={handleNavigate}
    />
  );
}

export function TransferTicketWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  const { ticketId } = useParams<{ ticketId: string }>();
  return (
    <TransferTicket
      ticketId={ticketId}
      orders={globalCompletedOrders}
      onNavigate={handleNavigate}
    />
  );
}

export function WishlistWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <Wishlist onNavigate={handleNavigate} />;
}

export function WaitlistWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <Waitlist onNavigate={handleNavigate} />;
}

export function OrganizerWizardWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <OrganizerWizard onNavigate={handleNavigate} />;
}

export function OrganizerDashboardWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <OrganizerDashboard onNavigate={handleNavigate} />;
}

export function EventManagementWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <EventManagement onNavigate={handleNavigate} />;
}

export function EventAnalyticsWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  const { eventId } = useParams<{ eventId: string }>();
  return <EventAnalytics eventId={eventId} onNavigate={handleNavigate} />;
}

export function EditEventWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <EditEvent onNavigate={handleNavigate} />;
}

export function ScanHistoryWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <ScanHistory onNavigate={handleNavigate} />;
}

export function PromoCodeManagementWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <PromoCodeManagement onNavigate={handleNavigate} />;
}

export function NotificationsWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <Notifications onNavigate={handleNavigate} />;
}

export function NotificationPreferencesWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <NotificationPreferences onNavigate={handleNavigate} />;
}

export function ResetPasswordWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <ResetPassword onNavigate={handleNavigate} />;
}

export function UserProfileWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <UserProfile onNavigate={handleNavigate} />;
}

export function SeatSelectionWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <SeatSelection onNavigate={handleNavigate} />;
}

export function ReviewSubmissionWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <ReviewSubmission onNavigate={handleNavigate} />;
}

export function QRScannerWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <QRScanner onNavigate={handleNavigate} />;
}

export function EmailVerificationWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <EmailVerification onNavigate={handleNavigate} />;
}

export function PasswordChangeWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <PasswordChange onNavigate={handleNavigate} />;
}

export function EventReviewsWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <EventReviews onNavigate={handleNavigate} />;
}

export function RefundRequestWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <RefundRequest onNavigate={handleNavigate} />;
}

export function AdminDashboardWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <AdminDashboard onNavigate={handleNavigate} />;
}

export function LoginWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <Login onNavigate={handleNavigate} />;
}

export function RegisterWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <Register onNavigate={handleNavigate} />;
}

export function ForgotPasswordWrapper() {
  const { handleNavigate } = useNavigateAdapter();
  return <ForgotPassword onNavigate={handleNavigate} />;
}
