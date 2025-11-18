import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EventReviews } from "./pages/EventReviews";
import { RefundRequest } from "./pages/RefundRequest";
import { NotificationPreferences } from "./pages/NotificationPreferences";
import { SeatMapBuilder } from "./pages/SeatMapBuilder";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Home } from "./pages/Home";
import { EventListing } from "./pages/EventListing";
import { EventDetail } from "./pages/EventDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Success } from "./pages/Success";
import { MyTickets } from "./pages/MyTickets";
import { OrderDetail } from "./pages/OrderDetail";
import { TicketDetail } from "./pages/TicketDetail";
import { TransferTicket } from "./pages/TransferTicket";
import { Wishlist } from "./pages/Wishlist";
import { Waitlist } from "./pages/Waitlist";
import { OrganizerWizard } from "./pages/OrganizerWizard";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { EventManagement } from "./pages/EventManagement";
import { EventAnalytics } from "./pages/EventAnalytics";
import { EditEvent } from "./pages/EditEvent";
import { ScanHistory } from "./pages/ScanHistory";
import { PromoCodeManagement } from "./pages/PromoCodeManagement";
import { Notifications } from "./pages/Notifications";
import { ResetPassword } from "./pages/ResetPassword";
import { UserProfile } from "./pages/UserProfile";
import { SeatSelection } from "./pages/SeatSelection";
import { ReviewSubmission } from "./pages/ReviewSubmission";
import { QRScanner } from "./pages/QRScanner";
import { EmailVerification } from "./pages/EmailVerification";
import { PasswordChange } from "./pages/PasswordChange";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import type { CartItem, Order } from "./types";
import { mockOrders } from "./mockData";
import { authService } from "./services/authService";

type Page =
  | "home"
  | "listing"
  | "event-detail"
  | "cart"
  | "checkout"
  | "success"
  | "my-tickets"
  | "order-detail"
  | "ticket-detail"
  | "transfer-ticket"
  | "wishlist"
  | "waitlist"
  | "organizer-wizard"
  | "organizer-dashboard"
  | "event-management"
  | "event-analytics"
  | "edit-event"
  | "scan-history"
  | "promo-codes"
  | "notifications"
  | "notification-preferences"
  | "reset-password"
  | "user-profile"
  | "seat-selection"
  | "seat-map-builder"
  | "review-submission"
  | "qr-scanner"
  | "email-verification"
  | "password-change"
  | "event-reviews"
  | "refund-request"
  | "admin-dashboard"
  | "login"
  | "register"
  | "forgot-password";

interface AppProps {
  initialPage?: string;
}

export default function App({ initialPage }: AppProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial page from URL or prop
  const getPageFromPath = () => {
    const path = location.pathname;

    if (path === "/" || path === "/home") return "home";
    if (path === "/listing") return "listing";
    if (path.startsWith("/event/")) return "event-detail";
    if (path === "/cart") return "cart";
    if (path === "/checkout") return "checkout";
    if (path === "/success") return "success";
    if (path === "/my-tickets") return "my-tickets";
    if (path.startsWith("/order/")) return "order-detail";
    if (path.startsWith("/ticket/")) return "ticket-detail";
    if (path.startsWith("/transfer-ticket/")) return "transfer-ticket";
    if (path === "/wishlist") return "wishlist";
    if (path === "/waitlist") return "waitlist";
    if (path === "/organizer-wizard") return "organizer-wizard";
    if (path === "/organizer-dashboard") return "organizer-dashboard";
    if (path === "/event-management") return "event-management";
    if (path.startsWith("/event-analytics/")) return "event-analytics";
    if (path === "/edit-event") return "edit-event";
    if (path === "/scan-history") return "scan-history";
    if (path === "/promo-codes") return "promo-codes";
    if (path === "/notifications") return "notifications";
    if (path === "/notification-preferences") return "notification-preferences";
    if (path === "/reset-password") return "reset-password";
    if (path === "/user-profile") return "user-profile";
    if (path === "/seat-selection") return "seat-selection";
    if (path === "/seat-map-builder") return "seat-map-builder";
    if (path === "/review-submission") return "review-submission";
    if (path === "/qr-scanner") return "qr-scanner";
    if (path === "/email-verification") return "email-verification";
    if (path === "/password-change") return "password-change";
    if (path === "/event-reviews") return "event-reviews";
    if (path === "/refund-request") return "refund-request";
    if (path === "/admin-dashboard") return "admin-dashboard";
    if (path === "/login") return "login";
    if (path === "/register") return "register";
    if (path === "/forgot-password") return "forgot-password";

    return "home";
  };

  const [currentPage, setCurrentPage] = useState<Page>(() => {
    return (initialPage as Page) || getPageFromPath();
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>(mockOrders);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated()
  );
  const [userRole, setUserRole] = useState<"user" | "organizer" | "admin">(
    () => {
      const user = authService.getCurrentUser();
      return (
        (user?.role?.toLowerCase() as "user" | "organizer" | "admin") || "user"
      );
    }
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Extract IDs from URL path when location changes
  useEffect(() => {
    const path = location.pathname;
    
    // Extract eventId from URL
    if (path.startsWith("/event/")) {
      const eventId = path.split("/event/")[1]?.split("/")[0];
      if (eventId) setSelectedEventId(eventId);
    }
    
    // Extract orderId from URL
    if (path.startsWith("/order/")) {
      const orderId = path.split("/order/")[1]?.split("/")[0];
      if (orderId) {
        setSelectedOrderId(orderId);
        setCurrentPage("order-detail");
      }
    }
    
    // Extract ticketId from URL
    if (path.startsWith("/ticket/")) {
      const ticketId = path.split("/ticket/")[1]?.split("/")[0];
      if (ticketId) {
        setSelectedTicketId(ticketId);
        setCurrentPage("ticket-detail");
      }
    }
  }, [location.pathname]);

  // Check authentication on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const user = authService.getCurrentUser();
        if (user) {
          setUserRole(
            (user.role?.toLowerCase() as "user" | "organizer" | "admin") ||
              "user"
          );
        }
      } else {
        setUserRole("user");
      }
    };

    checkAuth();

    // Listen for storage changes (e.g., login in another tab)
    window.addEventListener("storage", checkAuth);
    // Listen for custom auth-change event
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  const handleNavigate = (page: string, id?: string) => {
    setCurrentPage(page as Page);

    // Navigate using React Router
    let path = `/${page}`;

    if (id) {
      // Determine what type of ID this is based on the page
      if (page === "event-detail") {
        setSelectedEventId(id);
        path = `/event/${id}`;
      } else if (page === "order-detail") {
        setSelectedOrderId(id);
        path = `/order/${id}`;
      } else if (page === "ticket-detail") {
        setSelectedTicketId(id);
        path = `/ticket/${id}`;
      } else if (page === "transfer-ticket") {
        path = `/transfer-ticket/${id}`;
      } else if (page === "event-analytics") {
        path = `/event-analytics/${id}`;
      } else {
        setSelectedEventId(id);
      }
    }

    navigate(path);
    window.scrollTo(0, 0);
  };

  const handleAddToCart = (items: CartItem[]) => {
    setCartItems(items);
  };

  const handleCompleteOrder = (order: Order) => {
    setCompletedOrders([...completedOrders, order]);
    setLastOrder(order);
    setCartItems([]);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={handleNavigate} isSearchOpen={isSearchOpen} />;

      case "listing":
        return <EventListing onNavigate={handleNavigate} />;

      case "event-detail":
        if (!selectedEventId) {
          setCurrentPage("home");
          return null;
        }
        return (
          <EventDetail
            eventId={selectedEventId}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
          />
        );

      case "cart":
        return (
          <Cart
            items={cartItems}
            onNavigate={handleNavigate}
            onUpdateCart={setCartItems}
          />
        );

      case "checkout":
        return (
          <Checkout
            items={cartItems}
            onNavigate={handleNavigate}
            onCompleteOrder={handleCompleteOrder}
          />
        );

      case "success":
        return <Success order={lastOrder} onNavigate={handleNavigate} />;

      case "my-tickets":
        return (
          <MyTickets orders={completedOrders} onNavigate={handleNavigate} />
        );

      case "order-detail":
        return (
          <OrderDetail
            orderId={selectedOrderId || undefined}
            orders={completedOrders}
            onNavigate={handleNavigate}
          />
        );

      case "ticket-detail":
        return (
          <TicketDetail
            ticketId={selectedTicketId || undefined}
            orders={completedOrders}
            onNavigate={handleNavigate}
          />
        );

      case "transfer-ticket":
        return (
          <TransferTicket
            ticketId={selectedTicketId || undefined}
            orders={completedOrders}
            onNavigate={handleNavigate}
          />
        );

      case "wishlist":
        return <Wishlist onNavigate={handleNavigate} />;

      case "waitlist":
        return <Waitlist onNavigate={handleNavigate} />;

      case "organizer-wizard":
        return <OrganizerWizard onNavigate={handleNavigate} />;

      case "organizer-dashboard":
        return <OrganizerDashboard onNavigate={handleNavigate} />;

      case "event-management":
        return <EventManagement onNavigate={handleNavigate} />;

      case "event-analytics":
        return (
          <EventAnalytics
            eventId={selectedEventId || undefined}
            onNavigate={handleNavigate}
          />
        );

      case "edit-event":
        return <EditEvent onNavigate={handleNavigate} />;

      case "scan-history":
        return <ScanHistory onNavigate={handleNavigate} />;

      case "promo-codes":
        return <PromoCodeManagement onNavigate={handleNavigate} />;

      case "notifications":
        return <Notifications onNavigate={handleNavigate} />;

      case "notification-preferences":
        return <NotificationPreferences onNavigate={handleNavigate} />;

      case "reset-password":
        return <ResetPassword onNavigate={handleNavigate} />;

      case "user-profile":
        return <UserProfile onNavigate={handleNavigate} />;

      case "seat-selection":
        return <SeatSelection onNavigate={handleNavigate} />;

      case "seat-map-builder":
        return <SeatMapBuilder onNavigate={handleNavigate} />;

      case "review-submission":
        return <ReviewSubmission onNavigate={handleNavigate} />;

      case "qr-scanner":
        return <QRScanner onNavigate={handleNavigate} />;

      case "email-verification":
        return <EmailVerification onNavigate={handleNavigate} />;

      case "password-change":
        return <PasswordChange onNavigate={handleNavigate} />;

      case "event-reviews":
        return <EventReviews onNavigate={handleNavigate} />;

      case "refund-request":
        return <RefundRequest onNavigate={handleNavigate} />;

      case "admin-dashboard":
        return <AdminDashboard onNavigate={handleNavigate} />;

      case "login":
        return <Login onNavigate={handleNavigate} />;

      case "register":
        return <Register onNavigate={handleNavigate} />;

      case "forgot-password":
        return <ForgotPassword onNavigate={handleNavigate} />;

      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  // Pages that don't need header/footer
  const isStandalonePage =
    currentPage === "login" ||
    currentPage === "register" ||
    currentPage === "forgot-password";

  return (
    <div className="min-h-screen flex flex-col">
      {!isStandalonePage && (
        <Header
          onNavigate={handleNavigate}
          currentPage={currentPage}
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          onSearchOpenChange={setIsSearchOpen}
        />
      )}
      <main className="flex-1">{renderPage()}</main>
      {!isStandalonePage && <Footer />}
    </div>
  );
}
