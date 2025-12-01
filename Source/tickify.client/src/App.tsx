import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingFallback } from "./components/LoadingFallback";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import type { CartItem, Order } from "./types";
import { mockOrders } from "./mockData";
import { authService } from "./services/authService";
import { Toaster } from "./components/ui/sonner";

// Lazy load các pages lớn để giảm initial bundle size
const EventReviews = lazy(() => import("./pages/EventReviews").then(m => ({ default: m.EventReviews })));
const RefundRequest = lazy(() => import("./pages/RefundRequest").then(m => ({ default: m.RefundRequest })));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences").then(m => ({ default: m.NotificationPreferences })));
const SeatMapBuilder = lazy(() => import("./pages/SeatMapBuilder").then(m => ({ default: m.SeatMapBuilder })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const EventListing = lazy(() => import("./pages/EventListing").then(m => ({ default: m.EventListing })));
const EventDetail = lazy(() => import("./pages/EventDetail").then(m => ({ default: m.EventDetail })));
const Cart = lazy(() => import("./pages/Cart").then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import("./pages/Checkout").then(m => ({ default: m.Checkout })));
const Success = lazy(() => import("./pages/Success").then(m => ({ default: m.Success })));
const MyTickets = lazy(() => import("./pages/MyTickets").then(m => ({ default: m.MyTickets })));
const OrderDetail = lazy(() => import("./pages/OrderDetail").then(m => ({ default: m.OrderDetail })));
const TicketDetail = lazy(() => import("./pages/TicketDetail").then(m => ({ default: m.TicketDetail })));
const TransferTicket = lazy(() => import("./pages/TransferTicket").then(m => ({ default: m.TransferTicket })));
const Wishlist = lazy(() => import("./pages/Wishlist").then(m => ({ default: m.Wishlist })));
const Waitlist = lazy(() => import("./pages/Waitlist").then(m => ({ default: m.Waitlist })));
const OrganizerWizard = lazy(() => import("./pages/OrganizerWizard").then(m => ({ default: m.OrganizerWizard })));
const CreateEvent = lazy(() => import("./pages/CreateEvent").then(m => ({ default: m.CreateEvent })));
const OrganizerDashboard = lazy(() => import("./pages/OrganizerDashboard").then(m => ({ default: m.OrganizerDashboard })));
const EventManagement = lazy(() => import("./pages/EventManagement").then(m => ({ default: m.EventManagement })));
const EventAnalytics = lazy(() => import("./pages/EventAnalytics").then(m => ({ default: m.EventAnalytics })));
const EditEvent = lazy(() => import("./pages/EditEvent").then(m => ({ default: m.EditEvent })));
const ScanHistory = lazy(() => import("./pages/ScanHistory").then(m => ({ default: m.ScanHistory })));
const PromoCodeManagement = lazy(() => import("./pages/PromoCodeManagement").then(m => ({ default: m.PromoCodeManagement })));
const OrganizerPayouts = lazy(() => import("./pages/OrganizerPayouts").then(m => ({ default: m.OrganizerPayouts })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then(m => ({ default: m.ResetPassword })));
const UserProfile = lazy(() => import("./pages/UserProfile").then(m => ({ default: m.UserProfile })));
const SeatSelection = lazy(() => import("./pages/SeatSelection").then(m => ({ default: m.SeatSelection })));
const ReviewSubmission = lazy(() => import("./pages/ReviewSubmission").then(m => ({ default: m.ReviewSubmission })));
const QRScanner = lazy(() => import("./pages/QRScanner").then(m => ({ default: m.QRScanner })));
const EmailVerification = lazy(() => import("./pages/EmailVerification").then(m => ({ default: m.EmailVerification })));
const PasswordChange = lazy(() => import("./pages/PasswordChange").then(m => ({ default: m.PasswordChange })));
const ChatPage = lazy(() => import("./pages/ChatPage").then(m => ({ default: m.ChatPage })));
const StaffChatPage = lazy(() => import("./pages/StaffChatPage").then(m => ({ default: m.StaffChatPage })));
const BecomeOrganizer = lazy(() => import("./pages/BecomeOrganizer").then(m => ({ default: m.BecomeOrganizer })));
const PaymentReturn = lazy(() => import("./pages/PaymentReturn"));
const About = lazy(() => import("./pages/About").then(m => ({ default: m.About })));
const Privacy = lazy(() => import("./pages/Privacy").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Terms").then(m => ({ default: m.Terms })));
const FAQ = lazy(() => import("./pages/FAQ").then(m => ({ default: m.FAQ })));
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy").then(m => ({ default: m.RefundPolicy })));
const ForOrganizers = lazy(() => import("./pages/ForOrganizers").then(m => ({ default: m.ForOrganizers })));
const HelpCenter = lazy(() => import("./pages/HelpCenter").then(m => ({ default: m.HelpCenter })));
const Error = lazy(() => import("./pages/Error").then(m => ({ default: m.Error })));

// Keep frequently used pages non-lazy for faster initial load
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";

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
  | "create-event"
  | "organizer-wizard"
  | "organizer-dashboard"
  | "event-management"
  | "event-analytics"
  | "edit-event"
  | "scan-history"
  | "promo-codes"
  | "organizer-payouts"
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
  | "chat"
  | "staff-chat"
  | "become-organizer"
  | "login"
  | "register"
  | "forgot-password"
  | "payment-return"
  | "about"
  | "privacy"
  | "terms"
  | "faq"
  | "contact"
  | "refund-policy"
  | "for-organizers"
  | "help-center"
  | "error";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial page from URL or prop
  const getPageFromPath = useCallback(() => {
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
    if (path === "/create-event") return "create-event";
    if (path === "/organizer-wizard") return "organizer-wizard";
    if (path === "/organizer-dashboard") return "organizer-dashboard";
    if (path === "/event-management") return "event-management";
    if (path.startsWith("/event-analytics/")) return "event-analytics";
    if (path === "/edit-event") return "edit-event";
    if (path === "/scan-history") return "scan-history";
    if (path === "/promo-codes") return "promo-codes";
    if (path === "/organizer-payouts") return "organizer-payouts";
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
    if (path.startsWith("/event-reviews")) {
      return "event-reviews";
    }
    if (path === "/refund-request") return "refund-request";
    if (path === "/admin-dashboard") return "admin-dashboard";
    if (path === "/chat") return "chat";
    if (path === "/staff-chat") return "staff-chat";
    if (path === "/become-organizer") return "become-organizer";
    if (path === "/login") return "login";
    if (path === "/register") return "register";
    if (path === "/forgot-password") return "forgot-password";
    if (path.startsWith("/payment/return")) return "payment-return";
    if (path === "/about") return "about";
    if (path === "/privacy") return "privacy";
    if (path === "/terms") return "terms";
    if (path === "/faq") return "faq";
    if (path === "/contact") return "contact";
    if (path === "/refund-policy") return "refund-policy";
    if (path === "/for-organizers") return "for-organizers";
    if (path === "/help-center") return "help-center";
    if (path === "/error") return "error";

    return "home";
  }, [location.pathname]);

  const [currentPage, setCurrentPage] = useState<Page>(getPageFromPath);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>(mockOrders);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated()
  );
  const [userRole, setUserRole] = useState<
    "guest" | "user" | "organizer" | "staff" | "admin"
  >(() => {
    const user = authService.getCurrentUser();
    if (!user) return "guest";
    return (
      (user?.role?.toLowerCase() as
        | "guest"
        | "user"
        | "organizer"
        | "staff"
        | "admin") || "user"
    );
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Derive page from URL - no need for effect
  const currentPageFromUrl = useMemo(() => getPageFromPath(), [getPageFromPath]);

  // Update currentPage when URL changes
  useEffect(() => {
    setCurrentPage(currentPageFromUrl);
  }, [currentPageFromUrl]);

  // Extract IDs from URL params
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
      if (orderId) setSelectedOrderId(orderId);
    }

    // Extract ticketId from URL
    if (path.startsWith("/ticket/")) {
      const ticketId = path.split("/ticket/")[1]?.split("/")[0];
      if (ticketId) setSelectedTicketId(ticketId);
    }

    // Extract ticketId from transfer-ticket URL
    if (path.startsWith("/transfer-ticket/")) {
      const ticketId = path.split("/transfer-ticket/")[1]?.split("/")[0];
      if (ticketId) setSelectedTicketId(ticketId);
    }

    // Extract eventId from event-analytics URL
    if (path.startsWith("/event-analytics/")) {
      const eventId = path.split("/event-analytics/")[1]?.split("/")[0];
      if (eventId) setSelectedEventId(eventId);
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
            (user.role?.toLowerCase() as
              | "guest"
              | "user"
              | "organizer"
              | "staff"
              | "admin") || "user"
          );
        }
      } else {
        setUserRole("guest");
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
      } else if (page === "event-reviews") {
        setSelectedEventId(id);
        path = `/event-reviews/${id}`;
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

      case "event-detail": {
        // Extract eventId from URL directly to avoid race condition
        const eventIdFromUrl = location.pathname.startsWith("/event/")
          ? location.pathname.split("/event/")[1]?.split("/")[0]
          : selectedEventId;

        if (!eventIdFromUrl) {
          navigate("/");
          return null;
        }
        return (
          <EventDetail
            eventId={eventIdFromUrl}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
          />
        );
      }

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

      case "order-detail": {
        // Extract orderId from URL directly
        const orderIdFromUrl = location.pathname.startsWith("/order/")
          ? location.pathname.split("/order/")[1]?.split("/")[0]
          : selectedOrderId;

        return (
          <OrderDetail
            orderId={orderIdFromUrl || undefined}
            orders={completedOrders}
            onNavigate={handleNavigate}
          />
        );
      }

      case "ticket-detail": {
        // Extract ticketId from URL directly
        const ticketIdFromUrl = location.pathname.startsWith("/ticket/")
          ? location.pathname.split("/ticket/")[1]?.split("/")[0]
          : selectedTicketId;

        return (
          <TicketDetail
            ticketId={ticketIdFromUrl || undefined}
            orders={completedOrders}
            onNavigate={handleNavigate}
          />
        );
      }

      case "transfer-ticket": {
        // Extract ticketId from URL directly
        const transferTicketIdFromUrl = location.pathname.startsWith(
          "/transfer-ticket/"
        )
          ? location.pathname.split("/transfer-ticket/")[1]?.split("/")[0]
          : selectedTicketId;

        return (
          <TransferTicket
            ticketId={transferTicketIdFromUrl || undefined}
            orders={completedOrders}
            onNavigate={handleNavigate}
          />
        );
      }

      case "wishlist":
        return <Wishlist onNavigate={handleNavigate} />;

      case "waitlist":
        return <Waitlist onNavigate={handleNavigate} />;

      case "create-event":
        return <CreateEvent onNavigate={handleNavigate} />;

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
        return <PromoCodeManagement />;

      case "organizer-payouts":
        return <OrganizerPayouts onNavigate={handleNavigate} />;

      case "notifications":
        return <NotificationsPage onNavigate={handleNavigate} />;

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
        return <ReviewSubmission eventId={selectedEventId || undefined} onNavigate={handleNavigate} />;

      case "qr-scanner":
        return <QRScanner onNavigate={handleNavigate} />;

      case "email-verification":
        return <EmailVerification onNavigate={handleNavigate} />;

      case "password-change":
        return <PasswordChange onNavigate={handleNavigate} />;

      case "event-reviews": {
        // Extract eventId from URL directly
        const eventIdFromUrl = location.pathname.startsWith("/event-reviews/")
          ? location.pathname.split("/event-reviews/")[1]?.split("/")[0]
          : selectedEventId;
        
        return <EventReviews eventId={eventIdFromUrl || undefined} onNavigate={handleNavigate} />;
      }

      case "refund-request":
        return <RefundRequest onNavigate={handleNavigate} />;

      case "admin-dashboard":
        return <AdminDashboard onNavigate={handleNavigate} />;

      case "chat":
        return <ChatPage />;

      case "staff-chat":
        return <StaffChatPage />;

      case "become-organizer":
        return <BecomeOrganizer onNavigate={handleNavigate} />;

      case "login":
        return <Login onNavigate={handleNavigate} />;

      case "register":
        return <Register onNavigate={handleNavigate} />;

      case "forgot-password":
        return <ForgotPassword onNavigate={handleNavigate} />;

      case "payment-return":
        return <PaymentReturn />;

      case "about":
        return <About />;

      case "privacy":
        return <Privacy />;

      case "terms":
        return <Terms />;

      case "faq":
        return <FAQ />;

      case "contact":
        return <Contact />;

      case "refund-policy":
        return <RefundPolicy />;

      case "for-organizers":
        return <ForOrganizers onNavigate={handleNavigate} />;

      case "help-center":
        return <HelpCenter />;

      case "error":
        return <Error />;

      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  // Pages that don't need header/footer
  const isStandalonePage =
    currentPage === "login" ||
    currentPage === "register" ||
    currentPage === "forgot-password" ||
    currentPage === "payment-return";

  return (
    <ErrorBoundary>
      <ProtectedRoute>
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
          <main className="flex-1">
            <Suspense fallback={<LoadingFallback />}>
              {renderPage()}
            </Suspense>
          </main>
          {!isStandalonePage && <Footer />}
          <Toaster />
        </div>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}
