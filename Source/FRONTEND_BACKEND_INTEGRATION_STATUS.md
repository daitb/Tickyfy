# 🔗 FRONTEND-BACKEND INTEGRATION STATUS

**Ngày cập nhật:** 13/11/2025  
**Backend Server:** Running on http://localhost:5129 & https://localhost:7129  
**Frontend:** Running on Vite Dev Server

---

## 📊 TỔNG QUAN

### ✅ Backend APIs Đã Sẵn Sàng: 27+ endpoints (Developer 3)

### ⚠️ Frontend: **100% ĐANG DÙNG MOCK DATA**

### 🎯 Cần Tích Hợp: **ALL PAGES**

---

## 🔴 **HIỆN TRẠNG: TẤT CẢ FRONTEND PAGES ĐANG DÙNG MOCK DATA**

### **Mock Data Files:**

- `Source/frontend/src/mockData.ts` - Chứa toàn bộ mock data
  - `mockEvents` - 6 events giả
  - `mockOrders` - 3 orders giả
  - `mockWishlist` - 3 wishlist items giả
  - `mockWaitlist` - 3 waitlist entries giả
  - `categories` - Danh sách categories
  - `cities` - Danh sách cities

### **Frontend Pages Đang Dùng Mock:**

#### 🏠 **HOMEPAGE & BROWSING (4 pages)**

1. ✅ `Home.tsx` - Import `mockEvents, categories`
2. ✅ `EventListing.tsx` - Import `mockEvents`
3. ✅ `EventDetail.tsx` - Import `mockEvents`
4. ✅ `EventReviews.tsx` - Import `mockEvents` + inline mock reviews

#### 🎫 **BOOKING FLOW (5 pages)**

5. ✅ `SeatSelection.tsx` - Import `mockEvents` + local seat data
6. ✅ `Cart.tsx` - Dùng localStorage mock
7. ✅ `Checkout.tsx` - Simulate API call
8. ✅ `Success.tsx` - Import `mockEvents`
9. ✅ `MyTickets.tsx` - Import `mockOrders, mockEvents`

#### 📋 **ORDER & TICKETS (4 pages)**

10. ✅ `OrderDetail.tsx` - Import `mockEvents` + localStorage
11. ✅ `TicketDetail.tsx` - Import `mockEvents, mockOrders`
12. ✅ `TransferTicket.tsx` - Import `mockOrders, mockEvents`
13. ✅ `RefundRequest.tsx` - Import `mockEvents, mockOrders`

#### ⭐ **WISHLIST & WAITLIST (2 pages)**

14. ✅ `Wishlist.tsx` - Import `mockEvents, mockWishlist`
15. ✅ `Waitlist.tsx` - Import `mockEvents, mockWaitlist`

#### 👤 **USER PROFILE (3 pages)**

16. ✅ `Login.tsx` - Simulate API call
17. ✅ `Register.tsx` - Simulate API call
18. ✅ `ForgotPassword.tsx` - Simulate API call
19. ✅ `ResetPassword.tsx` - Simulate API call
20. ✅ `UserProfile.tsx` - Mock avatar URL
21. ✅ `PasswordChange.tsx` - Simulate API call

#### 🏢 **ORGANIZER (6 pages)**

22. ✅ `OrganizerWizard.tsx` - Import `categories, cities`
23. ✅ `OrganizerDashboard.tsx` - Import `mockEvents, mockOrders`
24. ✅ `EventManagement.tsx` - Import `mockEvents`
25. ✅ `EditEvent.tsx` - Import `mockEvents`
26. ✅ `EventAnalytics.tsx` - Import `mockEvents`
27. ✅ `PromoCodeManagement.tsx` - Local mock data

#### 📱 **QR & SCANNING (3 pages)**

28. ✅ `QRScanner.tsx` - Import `mockEvents` + inline mock
29. ✅ `ScanHistory.tsx` - Import `mockEvents` + inline mock

#### ⭐ **REVIEW (2 pages)**

30. ✅ `ReviewSubmission.tsx` - Import `mockEvents`
31. ✅ `EventReviews.tsx` - Already counted above

---

## 🎯 BACKEND APIs SẴN SÀNG CHỜ TÍCH HỢP

### **1. BOOKING APIs (6 endpoints)** ✅

- `POST /api/booking` - Create booking
- `GET /api/booking/{id}` - Booking details
- `GET /api/booking/my-bookings` - User's bookings
- `POST /api/booking/{id}/cancel` - Cancel booking
- `GET /api/booking/{id}/tickets` - Get tickets
- `PUT /api/booking/{id}/apply-promo` - Apply promo code

**Frontend Pages Cần Tích Hợp:**

- ✅ `Checkout.tsx` → POST /api/booking
- ✅ `OrderDetail.tsx` → GET /api/booking/{id}
- ✅ `MyTickets.tsx` → GET /api/booking/my-bookings
- ✅ `RefundRequest.tsx` → POST /api/booking/{id}/cancel

---

### **2. TICKET APIs (8 endpoints)** ✅

- `GET /api/ticket/{id}` - Ticket details
- `GET /api/ticket/my-tickets` - User's tickets
- `POST /api/ticket/{id}/transfer` - Transfer ticket
- `POST /api/ticket/transfers/{id}/accept` - Accept transfer
- `POST /api/ticket/transfers/{id}/reject` - Reject transfer
- `GET /api/ticket/{id}/qrcode` - Get QR code
- `POST /api/ticket/{id}/resend-email` - Resend email
- `GET /api/ticket/event/{eventId}` - Event tickets (Organizer)

**Frontend Pages Cần Tích Hợp:**

- ✅ `MyTickets.tsx` → GET /api/ticket/my-tickets
- ✅ `TicketDetail.tsx` → GET /api/ticket/{id}
- ✅ `TransferTicket.tsx` → POST /api/ticket/{id}/transfer
- ✅ `QRScanner.tsx` → Scan & validate QR

---

### **3. SEAT MANAGEMENT APIs (7 endpoints)** ✅ NEW

- `GET /api/seatmaps/{id}` - Seat map details
- `GET /api/seatmaps/event/{eventId}` - Event seat map
- `POST /api/seatmaps` - Create seat map (Organizer)
- `PUT /api/seatmaps/{id}` - Update seat map
- `DELETE /api/seatmaps/{id}` - Delete seat map
- `POST /api/seatmaps/{seatMapId}/reserve` - Reserve seats
- `POST /api/seatmaps/{seatMapId}/release` - Release seats

**Frontend Pages Cần Tích Hợp:**

- ✅ `SeatSelection.tsx` → GET /api/seatmaps/event/{eventId}
- ✅ `Checkout.tsx` → POST /api/seatmaps/{seatMapId}/reserve
- ✅ `EditEvent.tsx` → POST /api/seatmaps (create seat map)

---

### **4. PROMO CODE APIs (5 endpoints)** ✅

- `POST /api/promocodes/validate` - Validate promo
- `GET /api/promocodes` - List promo codes
- `POST /api/promocodes` - Create promo
- `PUT /api/promocodes/{id}` - Update promo
- `DELETE /api/promocodes/{id}` - Delete promo

**Frontend Pages Cần Tích Hợp:**

- ✅ `Checkout.tsx` → POST /api/promocodes/validate
- ✅ `PromoCodeManagement.tsx` → All CRUD operations

---

### **5. EVENT APIs (Available from Backend)** ⏸️

**Note:** Dev 2 đã implement Event APIs, cần kiểm tra endpoints

Potential endpoints:

- `GET /api/events` - List events
- `GET /api/events/{id}` - Event details
- `POST /api/events` - Create event
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event

**Frontend Pages Cần Tích Hợp:**

- ✅ `Home.tsx` → GET /api/events (featured)
- ✅ `EventListing.tsx` → GET /api/events (with filters)
- ✅ `EventDetail.tsx` → GET /api/events/{id}
- ✅ `EditEvent.tsx` → PUT /api/events/{id}
- ✅ `EventManagement.tsx` → GET /api/events (organizer's events)

---

### **6. AUTH APIs (Available from Backend)** ⏸️

**Note:** Dev 1 đã implement Auth APIs

Potential endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**Frontend Pages Cần Tích Hợp:**

- ✅ `Login.tsx` → POST /api/auth/login
- ✅ `Register.tsx` → POST /api/auth/register
- ✅ `ForgotPassword.tsx` → POST /api/auth/forgot-password
- ✅ `ResetPassword.tsx` → POST /api/auth/reset-password

---

## 📋 KẾ HOẠCH TÍCH HỢP

### **PHASE 1: Setup API Client (PRIORITY 1) 🔴**

**Tạo API Service Layer:**

```typescript
// src/services/apiClient.ts
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7129/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

```typescript
// src/services/bookingService.ts
import { apiClient } from "./apiClient";
import { CreateBookingDto, BookingDto } from "../types/booking";

export const bookingService = {
  createBooking: async (data: CreateBookingDto) => {
    const response = await apiClient.post<BookingDto>("/booking", data);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await apiClient.get<BookingDto[]>("/booking/my-bookings");
    return response.data;
  },

  getBookingById: async (id: number) => {
    const response = await apiClient.get<BookingDto>(`/booking/${id}`);
    return response.data;
  },

  cancelBooking: async (id: number, reason: string) => {
    const response = await apiClient.post(`/booking/${id}/cancel`, { reason });
    return response.data;
  },

  applyPromoCode: async (id: number, code: string) => {
    const response = await apiClient.put(`/booking/${id}/apply-promo`, {
      code,
    });
    return response.data;
  },
};
```

```typescript
// src/services/ticketService.ts
export const ticketService = {
  getMyTickets: async () => {
    const response = await apiClient.get("/ticket/my-tickets");
    return response.data;
  },

  getTicketById: async (id: number) => {
    const response = await apiClient.get(`/ticket/${id}`);
    return response.data;
  },

  transferTicket: async (id: number, recipientEmail: string) => {
    const response = await apiClient.post(`/ticket/${id}/transfer`, {
      recipientEmail,
    });
    return response.data;
  },
};
```

```typescript
// src/services/seatMapService.ts
export const seatMapService = {
  getSeatMapByEvent: async (eventId: number) => {
    const response = await apiClient.get(`/seatmaps/event/${eventId}`);
    return response.data;
  },

  reserveSeats: async (seatMapId: number, seatIds: number[]) => {
    const response = await apiClient.post(
      `/seatmaps/${seatMapId}/reserve`,
      seatIds
    );
    return response.data;
  },

  releaseSeats: async (seatMapId: number, seatIds: number[]) => {
    const response = await apiClient.post(
      `/seatmaps/${seatMapId}/release`,
      seatIds
    );
    return response.data;
  },
};
```

---

### **PHASE 2: Core Booking Flow (PRIORITY 2) 🟠**

**Pages to Update (Order):**

1. **`SeatSelection.tsx`**

   - Replace mock seat data with `seatMapService.getSeatMapByEvent()`
   - Implement real-time seat reservation: `seatMapService.reserveSeats()`
   - Add 15-minute countdown timer for reservation expiry

2. **`Checkout.tsx`**

   - Replace simulate API call with `bookingService.createBooking()`
   - Integrate promo code validation: `promoCodeService.validate()`
   - Handle booking creation response (booking ID, expiry time)

3. **`Success.tsx`**

   - Fetch real booking details: `bookingService.getBookingById()`
   - Display actual QR codes from backend

4. **`MyTickets.tsx`**

   - Replace `mockOrders` with `ticketService.getMyTickets()`
   - Display real ticket data with QR codes

5. **`TicketDetail.tsx`**
   - Replace mock data with `ticketService.getTicketById()`
   - Show real QR code from backend

---

### **PHASE 3: Order Management (PRIORITY 3) 🟡**

**Pages to Update:**

6. **`OrderDetail.tsx`**

   - Replace localStorage with `bookingService.getBookingById()`
   - Show real booking status and timeline

7. **`TransferTicket.tsx`**

   - Replace simulate with `ticketService.transferTicket()`
   - Handle transfer status updates

8. **`RefundRequest.tsx`**
   - Replace mock with `bookingService.cancelBooking()`
   - Integrate refund request flow (if API available)

---

### **PHASE 4: Event Browsing (PRIORITY 4) 🟢**

**Pages to Update:**

9. **`Home.tsx`**

   - Replace `mockEvents` with `eventService.getFeaturedEvents()`

10. **`EventListing.tsx`**

    - Replace `mockEvents` with `eventService.getEvents()` with filters

11. **`EventDetail.tsx`**
    - Replace `mockEvents` with `eventService.getEventById()`

---

### **PHASE 5: Authentication (PRIORITY 5) 🔵**

**Pages to Update:**

12. **`Login.tsx`**

    - Replace simulate with `authService.login()`
    - Store JWT token in localStorage

13. **`Register.tsx`**

    - Replace simulate with `authService.register()`

14. **`ForgotPassword.tsx`**

    - Replace simulate with `authService.forgotPassword()`

15. **`ResetPassword.tsx`**
    - Replace simulate with `authService.resetPassword()`

---

### **PHASE 6: Organizer Dashboard (PRIORITY 6) ⚪**

**Pages to Update:**

16. **`OrganizerDashboard.tsx`**

    - Replace mock with real organizer stats API

17. **`EventManagement.tsx`**

    - Replace mock with `eventService.getOrganizerEvents()`

18. **`EditEvent.tsx`**

    - Replace mock with `eventService.updateEvent()`

19. **`EventAnalytics.tsx`**

    - Replace mock with real analytics API (when available)

20. **`PromoCodeManagement.tsx`**
    - Replace mock with `promoCodeService` CRUD operations

---

### **PHASE 7: Advanced Features (PRIORITY 7) ⚪**

21. **`Wishlist.tsx`** - Integrate wishlist API (if available)
22. **`Waitlist.tsx`** - Integrate waitlist API (if available)
23. **`QRScanner.tsx`** - Integrate ticket validation API
24. **`ScanHistory.tsx`** - Integrate scan history API
25. **`ReviewSubmission.tsx`** - Integrate review API (if available)

---

## 🚀 HƯỚNG DẪN BẮT ĐẦU

### **Step 1: Test Backend APIs**

Mở Swagger: https://localhost:7129/swagger

Test các endpoints:

- ✅ POST /api/booking (Create booking)
- ✅ GET /api/booking/my-bookings
- ✅ GET /api/seatmaps/event/{eventId}

### **Step 2: Tạo Environment Variable**

```bash
# .env.local
VITE_API_BASE_URL=https://localhost:7129/api
```

### **Step 3: Tạo API Services**

```bash
mkdir -p src/services
touch src/services/apiClient.ts
touch src/services/bookingService.ts
touch src/services/ticketService.ts
touch src/services/seatMapService.ts
touch src/services/promoCodeService.ts
```

### **Step 4: Update First Page**

Bắt đầu với `Checkout.tsx`:

```typescript
// BEFORE (Mock)
const handleSubmit = async () => {
  // Simulate API call
  setTimeout(() => {
    onNavigate("success");
  }, 1000);
};

// AFTER (Real API)
import { bookingService } from "../services/bookingService";

const handleSubmit = async () => {
  try {
    const booking = await bookingService.createBooking({
      eventId: Number(eventId),
      ticketTypeId: selectedTier.id,
      quantity: cart.length,
      seatIds: selectedSeats,
      promoCode: promoCode || undefined,
    });

    // Store booking ID and redirect
    localStorage.setItem("lastBookingId", booking.id.toString());
    onNavigate("success");
  } catch (error) {
    console.error("Booking failed:", error);
    toast.error("Booking failed. Please try again.");
  }
};
```

### **Step 5: Test Integration**

1. Start backend: `dotnet run` (Port 5129)
2. Start frontend: `npm run dev` (Port 5173)
3. Test booking flow end-to-end
4. Check browser console for errors
5. Verify data in database

---

## 📊 PROGRESS TRACKING

### **Backend Ready:** ✅ 27 endpoints

### **Frontend Pages:** 30 pages

### **Integrated:** ❌ 0 pages (0%)

### **Remaining:** 🔴 30 pages (100%)

---

## 🎯 PRIORITY ORDER

1. 🔴 **P1:** API Client Setup (1 day)
2. 🟠 **P2:** Booking Flow Integration (2-3 days)
   - SeatSelection → Checkout → Success → MyTickets → TicketDetail
3. 🟡 **P3:** Order Management (1 day)
   - OrderDetail, TransferTicket, RefundRequest
4. 🟢 **P4:** Event Browsing (1 day)
   - Home, EventListing, EventDetail
5. 🔵 **P5:** Authentication (1 day)
   - Login, Register, ForgotPassword, ResetPassword
6. ⚪ **P6:** Organizer Features (2 days)
7. ⚪ **P7:** Advanced Features (2 days)

**Total Estimate:** 10-12 days

---

## ⚠️ QUAN TRỌNG

### **Manual SQL Script Chưa Chạy:**

File `Migrations/AddSeatManagementSystem_Manual.sql` cần được execute trong Azure Data Studio trước khi test Seat Management APIs.

### **Swagger URL:**

https://localhost:7129/swagger

### **Backend Port:**

- HTTP: http://localhost:5129
- HTTPS: https://localhost:7129

---

## 📝 NOTES

- Tất cả frontend pages hiện tại đều hoạt động với mock data
- Backend APIs đã sẵn sàng và tested
- Cần tích hợp từng page một để đảm bảo chất lượng
- Ưu tiên booking flow vì đây là core feature
- Authentication cần được implement trước các protected routes

---

**Updated:** November 13, 2025
**Status:** Ready for Integration 🚀
