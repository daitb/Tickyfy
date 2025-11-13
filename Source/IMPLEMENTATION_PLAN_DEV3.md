# 📋 KẾ HOẠCH HOÀN THIỆN CHỨC NĂNG DEVELOPER 3

## 🎯 MỤC TIÊU

1. ✅ Hoàn thiện Backend API (Auth, Booking, Ticket, PromoCode, Seat)
2. ✅ Tích hợp Backend vào Frontend UI
3. ✅ Phân quyền User vs Organizer
4. ✅ Thêm Organizer Header cho navigation

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### Backend Status (đã có sẵn):

- ✅ AuthController (Register, Login, Logout, Refresh Token)
- ✅ BookingController (Create, Get, Cancel, GetByUser)
- ✅ TicketController (Get, Transfer, Cancel, Validate, CheckIn)
- ✅ SeatMapController (GetByEvent, Reserve, Release)
- ✅ PaymentsController (Create, Confirm, GetByBooking)
- ✅ PromoCode service đã register trong Program.cs

### Frontend Status (đã có sẵn):

- ✅ Cart.tsx - Integrated với promoCodeService
- ✅ Checkout.tsx - Integrated với bookingService
- ✅ Success.tsx - Integrated với bookingService
- ✅ MyTickets.tsx - Integrated với ticketService
- ⚠️ Login.tsx - Chưa integrate (Dev 1's task nhưng cần cho Dev 3)
- ⚠️ Register.tsx - Chưa integrate
- ❌ Organizer Header - Chưa có

---

## 🔄 FLOW THỰC HIỆN

### **PHASE 1: AUTHENTICATION SETUP (2-3 giờ)**

#### Step 1.1: Kiểm tra & Fix Backend Auth APIs

```
Location: Source/backend/Tickify/Tickify/Controllers/AuthController.cs

Endpoints cần test:
✅ POST /api/Auth/register
✅ POST /api/Auth/login
✅ POST /api/Auth/refresh-token
✅ POST /api/Auth/logout
✅ GET /api/Auth/verify-email
✅ POST /api/Auth/forgot-password
✅ POST /api/Auth/reset-password
```

**Action Items:**

- [ ] Start backend: `dotnet run --urls "http://localhost:5129;https://localhost:7129"`
- [ ] Test trong Swagger: https://localhost:7129/swagger
- [ ] Kiểm tra response format (ApiResponse wrapper)
- [ ] Test JWT token generation
- [ ] Test role assignment (User vs Organizer)

#### Step 1.2: Tạo authService.ts mới (hoặc sửa)

```
Location: Source/frontend/src/services/authService.ts

Methods cần có:
- register(data: RegisterDto)
- login(data: LoginDto)
- logout()
- getCurrentUser()
- isAuthenticated()
- hasRole(role: string)
- refreshToken()
```

#### Step 1.3: Integrate Login.tsx

```
Location: Source/frontend/src/pages/Login.tsx

Changes:
1. Import authService
2. Add state: email, password, error, isLoading
3. Handle submit → authService.login()
4. Save token to localStorage
5. Redirect based on role:
   - User → /home
   - Organizer → /organizer-dashboard
   - Admin → /admin-dashboard
```

#### Step 1.4: Integrate Register.tsx

```
Location: Source/frontend/src/pages/Register.tsx

Changes:
1. Import authService
2. Add form fields: fullName, email, password, confirmPassword, role
3. Add role selector: User / Organizer
4. Handle submit → authService.register()
5. Show email verification message
6. Redirect to /login after success
```

---

### **PHASE 2: PROTECTED ROUTES & AUTH GUARD (1 giờ)**

#### Step 2.1: Tạo ProtectedRoute component

```typescript
// Location: Source/frontend/src/components/ProtectedRoute.tsx

import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";

interface Props {
  children: React.ReactNode;
  requiredRole?: "User" | "Organizer" | "Admin";
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const isAuthenticated = authService.isAuthenticated();
  const hasRole = requiredRole ? authService.hasRole(requiredRole) : true;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

#### Step 2.2: Wrap routes trong Router.tsx

```typescript
// User routes
{
  path: "my-tickets",
  element: <ProtectedRoute requiredRole="User">
    <MyTicketsWrapper />
  </ProtectedRoute>
}

// Organizer routes
{
  path: "organizer-dashboard",
  element: <ProtectedRoute requiredRole="Organizer">
    <OrganizerDashboardWrapper />
  </ProtectedRoute>
}
```

---

### **PHASE 3: ORGANIZER HEADER (1-2 giờ)**

#### Step 3.1: Tạo OrganizerHeader component

```typescript
// Location: Source/frontend/src/components/OrganizerHeader.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { authService } from "../services/authService";

export function OrganizerHeader() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const menuItems = [
    { label: "Dashboard", path: "/organizer-dashboard" },
    { label: "Event Management", path: "/event-management" },
    { label: "Create Event", path: "/organizer-wizard" },
    { label: "Analytics", path: "/event-analytics" },
    { label: "Promo Codes", path: "/promo-codes" },
    { label: "QR Scanner", path: "/qr-scanner" },
    { label: "Scan History", path: "/scan-history" },
    { label: "Seat Map Builder", path: "/seat-map-builder" },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-[#00C16A]">
              Tickify Organizer
            </h1>
            <nav className="flex gap-4">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">{user?.email}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### Step 3.2: Tạo OrganizerLayout

```typescript
// Location: Source/frontend/src/components/OrganizerLayout.tsx

import { Outlet } from "react-router-dom";
import { OrganizerHeader } from "./OrganizerHeader";

export function OrganizerLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizerHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

#### Step 3.3: Update Router.tsx

```typescript
// Thêm OrganizerLayout vào router
{
  path: "/",
  element: <OrganizerLayout />,
  children: [
    { path: "organizer-dashboard", element: <OrganizerDashboardWrapper /> },
    { path: "event-management", element: <EventManagementWrapper /> },
    { path: "organizer-wizard", element: <OrganizerWizardWrapper /> },
    { path: "event-analytics/:eventId", element: <EventAnalyticsWrapper /> },
    { path: "promo-codes", element: <PromoCodeManagementWrapper /> },
    { path: "qr-scanner", element: <QRScannerWrapper /> },
    { path: "scan-history", element: <ScanHistoryWrapper /> },
    { path: "seat-map-builder", element: <SeatMapBuilderWrapper /> },
  ]
}
```

---

### **PHASE 4: BOOKING FLOW INTEGRATION (2-3 giờ)**

#### Step 4.1: Fix bookingService.ts

```typescript
// Location: Source/frontend/src/services/bookingService.ts

import { apiClient } from "./apiClient";

export interface CreateBookingDto {
  eventId: number;
  ticketTypeId: number;
  quantity: number;
  seatIds?: number[];
  promoCode?: string;
}

export interface BookingDetailDto {
  bookingId: number;
  eventName: string;
  bookingDate: string;
  totalAmount: number;
  status: string;
  tickets: TicketDto[];
}

export const bookingService = {
  createBooking: async (data: CreateBookingDto) => {
    const response = await apiClient.post("/Booking", data);
    return response.data;
  },

  getBookingDetails: async (bookingId: number) => {
    const response = await apiClient.get(`/Booking/${bookingId}`);
    return response.data;
  },

  cancelBooking: async (bookingId: number) => {
    const response = await apiClient.post(`/Booking/${bookingId}/cancel`);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await apiClient.get("/Booking/user");
    return response.data;
  },
};
```

#### Step 4.2: Test Checkout Integration

```
✅ Đã integrate sẵn trong Checkout.tsx
✅ Kiểm tra:
  - Form validation
  - API call với đúng payload
  - Error handling
  - Success redirect to /success
  - bookingId save to localStorage
```

#### Step 4.3: Test Success Page Integration

```
✅ Đã integrate sẵn trong Success.tsx
✅ Kiểm tra:
  - Load bookingId from localStorage
  - API call GET /Booking/{id}
  - Display booking details
  - Display tickets with QR codes
  - Download tickets button
```

---

### **PHASE 5: TICKET MANAGEMENT (1-2 giờ)**

#### Step 5.1: Complete ticketService.ts

```typescript
// Location: Source/frontend/src/services/ticketService.ts

export const ticketService = {
  getMyTickets: async () => {
    const response = await apiClient.get("/Ticket/user");
    return response.data;
  },

  getTicketDetail: async (ticketId: number) => {
    const response = await apiClient.get(`/Ticket/${ticketId}`);
    return response.data;
  },

  transferTicket: async (ticketId: number, recipientEmail: string) => {
    const response = await apiClient.post(`/Ticket/${ticketId}/transfer`, {
      recipientEmail,
    });
    return response.data;
  },

  cancelTicket: async (ticketId: number) => {
    const response = await apiClient.post(`/Ticket/${ticketId}/cancel`);
    return response.data;
  },

  downloadTicket: async (ticketId: number) => {
    const response = await apiClient.get(`/Ticket/${ticketId}/download`, {
      responseType: "blob",
    });
    return response.data;
  },
};
```

#### Step 5.2: Test MyTickets Integration

```
✅ Đã integrate sẵn trong MyTickets.tsx
✅ Kiểm tra:
  - Load tickets from API
  - Filter: All/Upcoming/Past
  - Display QR codes
  - Ticket status badges
  - Click to view detail
```

---

### **PHASE 6: PROMO CODE INTEGRATION (30 phút)**

#### Step 6.1: Complete promoCodeService.ts

```typescript
// Location: Source/frontend/src/services/promoCodeService.ts

export const promoCodeService = {
  validatePromoCode: async (code: string) => {
    const response = await apiClient.post("/PromoCode/validate", { code });
    return response.data;
  },

  // For Organizer only
  createPromoCode: async (data: CreatePromoCodeDto) => {
    const response = await apiClient.post("/PromoCode", data);
    return response.data;
  },

  getAllPromoCodes: async () => {
    const response = await apiClient.get("/PromoCode");
    return response.data;
  },

  updatePromoCode: async (id: number, data: UpdatePromoCodeDto) => {
    const response = await apiClient.put(`/PromoCode/${id}`, data);
    return response.data;
  },

  deletePromoCode: async (id: number) => {
    const response = await apiClient.delete(`/PromoCode/${id}`);
    return response.data;
  },
};
```

#### Step 6.2: Test Cart Promo Validation

```
✅ Đã integrate sẵn trong Cart.tsx
✅ Kiểm tra:
  - Nhập promo code
  - Click Apply
  - Loading state
  - Success/Error message
  - Discount amount update
```

---

### **PHASE 7: SEAT SELECTION (Optional - 2 giờ)**

#### Step 7.1: Create seatService.ts

```typescript
// Location: Source/frontend/src/services/seatService.ts

export const seatService = {
  getSeatsByEvent: async (eventId: number) => {
    const response = await apiClient.get(`/SeatMap/event/${eventId}`);
    return response.data;
  },

  reserveSeats: async (eventId: number, seatIds: number[]) => {
    const response = await apiClient.post("/SeatMap/reserve", {
      eventId,
      seatIds,
    });
    return response.data;
  },

  releaseSeats: async (eventId: number, seatIds: number[]) => {
    const response = await apiClient.post("/SeatMap/release", {
      eventId,
      seatIds,
    });
    return response.data;
  },

  getAvailableSeats: async (eventId: number) => {
    const response = await apiClient.get(`/SeatMap/event/${eventId}/available`);
    return response.data;
  },
};
```

#### Step 7.2: Integrate SeatSelection.tsx

```
Location: Source/frontend/src/pages/SeatSelection.tsx

Changes:
1. Import seatService
2. Load seats on mount
3. Handle seat click → reserve/release
4. Show seat status (Available/Reserved/Sold)
5. Add to cart with selected seatIds
```

---

## 🧪 TESTING FLOW

### Test 1: User Registration & Login

```
1. Navigate to /register
2. Fill form with role="User"
3. Submit → Check API call
4. Navigate to /login
5. Login with credentials
6. Check JWT token in localStorage
7. Check redirect to /home
```

### Test 2: User Booking Flow

```
1. Login as User
2. Browse events → /listing
3. Select event → /event-detail/:id
4. Add to cart
5. Navigate to /cart
6. Apply promo code
7. Proceed to /checkout
8. Fill form & submit
9. Check API call POST /Booking
10. Redirect to /success
11. View booking details
12. Navigate to /my-tickets
13. View all tickets
```

### Test 3: Organizer Access

```
1. Navigate to /register
2. Fill form with role="Organizer"
3. Submit & verify email
4. Login with organizer credentials
5. Check redirect to /organizer-dashboard
6. Check OrganizerHeader displays
7. Navigate between organizer pages:
   - Event Management
   - Create Event
   - Promo Codes
   - QR Scanner
   - Scan History
   - Seat Map Builder
```

### Test 4: Protected Routes

```
1. Logout
2. Try to access /my-tickets → Redirect to /login
3. Try to access /organizer-dashboard → Redirect to /login
4. Login as User
5. Try to access /organizer-dashboard → Redirect to /unauthorized
```

### Test 5: Full Booking Cycle

```
1. User login
2. Create booking with promo code
3. Check booking status in Success page
4. Check tickets in My Tickets
5. Transfer ticket to another email
6. Cancel ticket
7. Request refund (if implemented)
```

---

## 📦 DELIVERABLES

### Backend:

- ✅ All controllers working (Auth, Booking, Ticket, PromoCode, Seat)
- ✅ JWT authentication configured
- ✅ Role-based authorization (User, Organizer, Admin)
- ✅ Database seeded with test data

### Frontend:

- ✅ authService.ts complete
- ✅ Login.tsx integrated
- ✅ Register.tsx integrated
- ✅ ProtectedRoute component
- ✅ OrganizerHeader component
- ✅ OrganizerLayout component
- ✅ All Dev 3 pages integrated with backend
- ✅ Error handling in all pages
- ✅ Loading states in all pages

### Documentation:

- ✅ API documentation in Swagger
- ✅ Testing guide (DEV3_TESTING_GUIDE.md)
- ✅ Implementation plan (this file)

---

## 🚀 QUICK START COMMANDS

### Start Backend

```powershell
cd "d:\!course\FPT\Tickify\tickify-event-management\Source\backend\Tickify\Tickify"
dotnet run --urls "http://localhost:5129;https://localhost:7129"
```

### Start Frontend

```powershell
cd "d:\!course\FPT\Tickify\tickify-event-management\Source\frontend"
npm run dev
```

### Test URLs

```
Backend Swagger: https://localhost:7129/swagger
Frontend: http://localhost:3000

User Pages:
- /login
- /register
- /home
- /listing
- /event-detail/:id
- /cart
- /checkout
- /success
- /my-tickets

Organizer Pages:
- /organizer-dashboard
- /event-management
- /organizer-wizard
- /event-analytics/:id
- /promo-codes
- /qr-scanner
- /scan-history
- /seat-map-builder
```

---

## ⏱️ TIME ESTIMATE

| Phase     | Task                      | Time       |
| --------- | ------------------------- | ---------- |
| 1         | Authentication Setup      | 2-3h       |
| 2         | Protected Routes          | 1h         |
| 3         | Organizer Header          | 1-2h       |
| 4         | Booking Integration       | 2-3h       |
| 5         | Ticket Management         | 1-2h       |
| 6         | Promo Code                | 30m        |
| 7         | Seat Selection (Optional) | 2h         |
| Testing   | Full System Test          | 2h         |
| **TOTAL** |                           | **12-15h** |

---

## 🎯 PRIORITY ORDER

### Must Have (Phase 1-4):

1. ✅ Authentication (Login/Register)
2. ✅ Protected Routes
3. ✅ Organizer Header
4. ✅ Booking Flow (Cart → Checkout → Success)

### Should Have (Phase 5-6):

5. ✅ Ticket Management (MyTickets)
6. ✅ Promo Code Validation

### Nice to Have (Phase 7):

7. ⚪ Seat Selection Integration

---

## 📝 NOTES

- Backend đã có đầy đủ APIs, không cần code thêm
- Frontend services đã được tạo sẵn một phần
- Chỉ cần integrate UI components với services
- Swagger URL để test: https://localhost:7129/swagger
- JWT token expire time: 60 phút (có thể config)
- Refresh token expire: 7 ngày

---

## 🔗 RELATED FILES

### Backend:

- `Program.cs` - DI registration
- `Controllers/AuthController.cs` - Auth APIs
- `Controllers/BookingController.cs` - Booking APIs
- `Controllers/TicketController.cs` - Ticket APIs
- `Services/Auth/AuthService.cs` - Auth business logic
- `Services/BookingService.cs` - Booking business logic
- `Services/TicketService.cs` - Ticket business logic

### Frontend:

- `src/services/authService.ts` - Auth API calls
- `src/services/bookingService.ts` - Booking API calls
- `src/services/ticketService.ts` - Ticket API calls
- `src/services/promoCodeService.ts` - PromoCode API calls
- `src/pages/Login.tsx` - Login UI
- `src/pages/Register.tsx` - Register UI
- `src/pages/Cart.tsx` - Cart UI
- `src/pages/Checkout.tsx` - Checkout UI
- `src/pages/Success.tsx` - Success UI
- `src/pages/MyTickets.tsx` - MyTickets UI

---

## ✅ COMPLETION CRITERIA

Project is complete when:

- [ ] User can register & login successfully
- [ ] JWT token is stored and used correctly
- [ ] Protected routes work (redirect to /login if not authenticated)
- [ ] Organizer has separate header with navigation
- [ ] User can complete full booking flow (Cart → Checkout → Success)
- [ ] User can view tickets in My Tickets page
- [ ] Promo code validation works in Cart
- [ ] All API calls use correct Authorization header
- [ ] Error handling works (network errors, 401, 404, 500)
- [ ] Loading states display during API calls
- [ ] No TypeScript compile errors
- [ ] All Dev 3 pages have 0 errors

---

**LET'S BUILD! 🚀**
