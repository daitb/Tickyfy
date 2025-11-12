import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  Outlet,
  useOutletContext,
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
import { OrganizerWizard } from "./pages/OrganizerWizard";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { VerifyEmail } from "./pages/VerifyEmail";
import { UserProfile } from "./pages/UserProfile";
import { ChangePassword } from "./pages/ChangePassword";
import { OrderDetail } from "./pages/OrderDetail";
import { TicketDetail } from "./pages/TicketDetail";
import { Wishlist } from "./pages/Wishlist";
import { Waitlist } from "./pages/Waitlist";
import { CartItem, Order } from "./types";

// Layout component cho pages có Header và Footer
function MainLayout() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated] = useState(false);

  const handleNavigate = (page: string, eventId?: string) => {
    const path = page === "home" ? "/" : `/${page}`;
    if (eventId) {
      navigate(`${path}?eventId=${eventId}`);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onNavigate={handleNavigate}
        currentPage="home"
        isAuthenticated={isAuthenticated}
        onSearchOpenChange={setIsSearchOpen}
      />
      <main className="flex-1">
        <Outlet context={{ handleNavigate, isSearchOpen }} />
      </main>
      <Footer />
    </div>
  );
}

// Layout component cho pages standalone (no header/footer)
function StandaloneLayout() {
  const navigate = useNavigate();

  const handleNavigate = (page: string, eventId?: string) => {
    const path = page === "home" ? "/" : `/${page}`;
    if (eventId) {
      navigate(`${path}?eventId=${eventId}`);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen">
      <Outlet context={{ handleNavigate }} />
    </div>
  );
}

// App State Provider
function AppStateProvider() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const handleAddToCart = (items: CartItem[]) => {
    setCartItems(items);
  };

  const handleCompleteOrder = (order: Order) => {
    setCompletedOrders([...completedOrders, order]);
    setLastOrder(order);
    setCartItems([]);
  };

  return (
    <Routes>
      {/* Main Layout Routes (with Header & Footer) */}
      <Route element={<MainLayout />}>
        <Route
          index
          element={
            <HomeWrapper
              cartItems={cartItems}
              completedOrders={completedOrders}
            />
          }
        />
        <Route path="/listing" element={<EventListingWrapper />} />
        <Route path="/events" element={<EventListingWrapper />} />
        <Route
          path="/event/:eventId"
          element={<EventDetailWrapper onAddToCart={handleAddToCart} />}
        />
        <Route
          path="/cart"
          element={
            <CartWrapper items={cartItems} onUpdateCart={setCartItems} />
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutWrapper
              items={cartItems}
              onCompleteOrder={handleCompleteOrder}
            />
          }
        />
        <Route path="/success" element={<SuccessWrapper order={lastOrder} />} />
        <Route
          path="/my-tickets"
          element={<MyTicketsWrapper orders={completedOrders} />}
        />
        <Route path="/organizer-wizard" element={<OrganizerWizardWrapper />} />
        <Route
          path="/organizer-dashboard"
          element={<OrganizerDashboardWrapper />}
        />
        <Route path="/user-profile" element={<UserProfileWrapper />} />
        <Route path="/profile" element={<UserProfileWrapper />} />
        <Route path="/order/:id" element={<OrderDetailWrapper />} />
        <Route path="/ticket/:id" element={<TicketDetailWrapper />} />
        <Route path="/wishlist" element={<WishlistWrapper />} />
        <Route path="/waitlist" element={<WaitlistWrapper />} />
      </Route>

      {/* Standalone Layout Routes (no Header & Footer) */}
      <Route element={<StandaloneLayout />}>
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/register" element={<RegisterWrapper />} />
        <Route path="/forgot-password" element={<ForgotPasswordWrapper />} />
        <Route path="/verify-email" element={<VerifyEmailWrapper />} />
        <Route path="/change-password" element={<ChangePasswordWrapper />} />
      </Route>
    </Routes>
  );
}

// Wrapper components để inject handleNavigate từ Outlet context
function HomeWrapper(_props: {
  cartItems: CartItem[];
  completedOrders: Order[];
}) {
  const { handleNavigate, isSearchOpen } = useOutletContext<any>();
  return <Home onNavigate={handleNavigate} isSearchOpen={isSearchOpen} />;
}

function EventListingWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <EventListing onNavigate={handleNavigate} />;
}

function EventDetailWrapper({
  onAddToCart,
}: {
  onAddToCart: (items: CartItem[]) => void;
}) {
  const { handleNavigate } = useOutletContext<any>();
  const { eventId } = useParams();
  return (
    <EventDetail
      eventId={eventId || ""}
      onNavigate={handleNavigate}
      onAddToCart={onAddToCart}
    />
  );
}

function CartWrapper({
  items,
  onUpdateCart,
}: {
  items: CartItem[];
  onUpdateCart: (items: CartItem[]) => void;
}) {
  const { handleNavigate } = useOutletContext<any>();
  return (
    <Cart
      items={items}
      onNavigate={handleNavigate}
      onUpdateCart={onUpdateCart}
    />
  );
}

function CheckoutWrapper({
  items,
  onCompleteOrder,
}: {
  items: CartItem[];
  onCompleteOrder: (order: Order) => void;
}) {
  const { handleNavigate } = useOutletContext<any>();
  return (
    <Checkout
      items={items}
      onNavigate={handleNavigate}
      onCompleteOrder={onCompleteOrder}
    />
  );
}

function SuccessWrapper({ order }: { order: Order | null }) {
  const { handleNavigate } = useOutletContext<any>();
  return <Success order={order} onNavigate={handleNavigate} />;
}

function MyTicketsWrapper({ orders }: { orders: Order[] }) {
  const { handleNavigate } = useOutletContext<any>();
  return <MyTickets orders={orders} onNavigate={handleNavigate} />;
}

function OrganizerWizardWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <OrganizerWizard onNavigate={handleNavigate} />;
}

function OrganizerDashboardWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <OrganizerDashboard onNavigate={handleNavigate} />;
}

function UserProfileWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <UserProfile onNavigate={handleNavigate} />;
}

function LoginWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <Login onNavigate={handleNavigate} />;
}

function RegisterWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <Register onNavigate={handleNavigate} />;
}

function ForgotPasswordWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <ForgotPassword onNavigate={handleNavigate} />;
}

function VerifyEmailWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <VerifyEmail onNavigate={handleNavigate} />;
}

function ChangePasswordWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <ChangePassword onNavigate={handleNavigate} />;
}

function OrderDetailWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <OrderDetail onNavigate={handleNavigate} />;
}

function TicketDetailWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <TicketDetail onNavigate={handleNavigate} />;
}

function WishlistWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <Wishlist onNavigate={handleNavigate} />;
}

function WaitlistWrapper() {
  const { handleNavigate } = useOutletContext<any>();
  return <Waitlist onNavigate={handleNavigate} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider />
    </BrowserRouter>
  );
}
