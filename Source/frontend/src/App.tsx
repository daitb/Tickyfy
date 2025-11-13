import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { EventListing } from "./pages/EventListing";
import { EventDetail } from "./pages/EventDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Success } from "./pages/Success";
import { MyTickets } from "./pages/MyTickets";
import { OrderDetail } from "./pages/OrderDetail";
import { TicketDetail } from "./pages/TicketDetail";
import { Wishlist } from "./pages/Wishlist";
import { Waitlist } from "./pages/Waitlist";
import { OrganizerWizard } from "./pages/OrganizerWizard";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { CartItem, Order } from "./types";
import { mockOrders } from "./mockData";

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
  | "wishlist"
  | "waitlist"
  | "organizer-wizard"
  | "organizer-dashboard"
  | "login"
  | "register"
  | "forgot-password";

import { useParams, useNavigate } from "react-router-dom";

function AppContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>(mockOrders);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const standaloneRoutes = ["/login", "/register", "/forgot-password"];
  const isStandalonePage = standaloneRoutes.includes(location.pathname);

  // Navigation handler for all pages
  const handleNavigate = (page: string, id?: string) => {
    switch (page) {
      case "home":
        navigate("/");
        break;
      case "listing":
        navigate("/listing");
        break;
      case "event-detail":
        navigate(`/event/${id}`);
        break;
      case "cart":
        navigate("/cart");
        break;
      case "checkout":
        navigate("/checkout");
        break;
      case "success":
        navigate("/success");
        break;
      case "my-tickets":
        navigate("/my-tickets");
        break;
      case "order-detail":
        navigate(`/order/${id}`);
        break;
      case "ticket-detail":
        navigate(`/ticket/${id}`);
        break;
      case "wishlist":
        navigate("/wishlist");
        break;
      case "waitlist":
        navigate("/waitlist");
        break;
      case "organizer-wizard":
        navigate("/organizer-wizard");
        break;
      case "organizer-dashboard":
        navigate("/organizer-dashboard");
        break;
      case "login":
        navigate("/login");
        break;
      case "register":
        navigate("/register");
        break;
      case "forgot-password":
        navigate("/forgot-password");
        break;
      default:
        navigate("/");
    }
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

  // Route param helpers
  function EventDetailWrapper() {
    const { eventId } = useParams();
    return (
      <EventDetail
        eventId={eventId || ""}
        onNavigate={handleNavigate}
        onAddToCart={handleAddToCart}
      />
    );
  }
  function OrderDetailWrapper() {
    const { orderId } = useParams();
    return (
      <OrderDetail
        orderId={orderId || undefined}
        orders={completedOrders}
        onNavigate={handleNavigate}
      />
    );
  }
  function TicketDetailWrapper() {
    const { ticketId } = useParams();
    return (
      <TicketDetail
        ticketId={ticketId || undefined}
        orders={completedOrders}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isStandalonePage && (
        <Header
          onNavigate={handleNavigate}
          currentPage={location.pathname}
          isAuthenticated={isAuthenticated}
          onSearchOpenChange={setIsSearchOpen}
        />
      )}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Home onNavigate={handleNavigate} isSearchOpen={isSearchOpen} />
            }
          />
          <Route
            path="/listing"
            element={<EventListing onNavigate={handleNavigate} />}
          />
          <Route path="/event/:eventId" element={<EventDetailWrapper />} />
          <Route
            path="/cart"
            element={
              <Cart
                items={cartItems}
                onNavigate={handleNavigate}
                onUpdateCart={setCartItems}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <Checkout
                items={cartItems}
                onNavigate={handleNavigate}
                onCompleteOrder={handleCompleteOrder}
              />
            }
          />
          <Route
            path="/success"
            element={<Success order={lastOrder} onNavigate={handleNavigate} />}
          />
          <Route
            path="/my-tickets"
            element={
              <MyTickets orders={completedOrders} onNavigate={handleNavigate} />
            }
          />
          <Route path="/order/:orderId" element={<OrderDetailWrapper />} />
          <Route path="/ticket/:ticketId" element={<TicketDetailWrapper />} />
          <Route
            path="/wishlist"
            element={<Wishlist onNavigate={handleNavigate} />}
          />
          <Route
            path="/waitlist"
            element={<Waitlist onNavigate={handleNavigate} />}
          />
          <Route
            path="/organizer-wizard"
            element={<OrganizerWizard onNavigate={handleNavigate} />}
          />
          <Route
            path="/organizer-dashboard"
            element={<OrganizerDashboard onNavigate={handleNavigate} />}
          />
          <Route
            path="/login"
            element={<Login onNavigate={handleNavigate} />}
          />
          <Route
            path="/register"
            element={<Register onNavigate={handleNavigate} />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword onNavigate={handleNavigate} />}
          />
          {/* Fallback route */}
          <Route
            path="*"
            element={
              <Home onNavigate={handleNavigate} isSearchOpen={isSearchOpen} />
            }
          />
        </Routes>
      </main>
      {!isStandalonePage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
