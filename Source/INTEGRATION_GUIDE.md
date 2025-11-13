# 🚀 HƯỚNG DẪN TÍCH HỢP FRONTEND - BACKEND

**Developer 3 - Booking & Ticket Management**

---

## ✅ ĐÃ HOÀN THÀNH

### Backend APIs (27 endpoints)

- ✅ Booking Controller (6 endpoints)
- ✅ Ticket Controller (8 endpoints)
- ✅ Seat Management Controller (7 endpoints)
- ✅ PromoCode Controller (5 endpoints)
- ✅ Database Models (Seat updated, SeatMap, SeatZone)
- ✅ Services & Repositories
- ✅ Build successful (0 errors)
- ✅ Server running on port 5129/7129

### API Services Created

- ✅ `apiClient.ts` - Axios instance with interceptors
- ✅ `bookingService.ts` - Booking CRUD operations
- ✅ `ticketService.ts` - Ticket management
- ✅ `seatMapService.ts` - Seat map & reservation
- ✅ `promoCodeService.ts` - Promo code validation

---

## 🎯 BẮT ĐẦU TÍCH HỢP - 5 BƯỚC

### **BƯỚC 1: Setup Environment**

```bash
cd Source/frontend

# Copy environment file
cp .env.example .env.local

# Edit .env.local
# VITE_API_BASE_URL=https://localhost:7129/api
```

---

### **BƯỚC 2: Test Backend APIs trong Swagger**

1. Mở trình duyệt: **https://localhost:7129/swagger**

2. Test các endpoints quan trọng:

**Booking APIs:**

```
GET /api/booking/my-bookings
POST /api/booking
```

**Seat Management:**

```
GET /api/seatmaps/event/{eventId}
POST /api/seatmaps/{seatMapId}/reserve
```

**Promo Code:**

```
POST /api/promocodes/validate
```

3. Note: Cần JWT token để test authenticated endpoints
   - Đăng nhập qua `/api/auth/login` để lấy token
   - Click "Authorize" button ở Swagger và paste token

---

### **BƯỚC 3: Chạy Manual SQL Script**

⚠️ **QUAN TRỌNG:** Phải chạy script SQL trước khi test Seat Management APIs

1. Mở **Azure Data Studio** hoặc **SQL Server Management Studio**

2. Connect tới:

   - Server: `tickify-sql-server.database.windows.net`
   - Database: `tickifydb`
   - Authentication: SQL Login

3. Open file: `Source/backend/Tickify/Tickify/Migrations/AddSeatManagementSystem_Manual.sql`

4. Execute script (F5)

5. Verify:

```sql
-- Check new tables created
SELECT * FROM sys.tables WHERE name IN ('SeatMaps', 'SeatZones');

-- Check Seats table updated
SELECT * FROM sys.columns
WHERE object_id = OBJECT_ID('Seats')
  AND name IN ('SeatZoneId', 'Status', 'ReservedByUserId');
```

---

### **BƯỚC 4: Test API Services trong Frontend**

**Option A: Test trong Browser Console**

1. Start frontend dev server:

```bash
cd Source/frontend
npm run dev
```

2. Mở http://localhost:5173

3. Open Developer Console (F12)

4. Test API:

```javascript
// Import service (nếu có module)
import bookingService from "./services/bookingService";

// Hoặc test trực tiếp
fetch("https://localhost:7129/api/booking/my-bookings", {
  headers: {
    Authorization: "Bearer YOUR_TOKEN_HERE",
  },
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

**Option B: Tạo Test Page**

Tạo file `Source/frontend/src/pages/APITest.tsx`:

```typescript
import { useState } from "react";
import { bookingService, seatMapService } from "../services";

export function APITest() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getMyBookings();
      setBookings(data);
      console.log("✅ Bookings:", data);
    } catch (err: any) {
      setError(err.message);
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const testGetSeatMap = async () => {
    try {
      setLoading(true);
      const data = await seatMapService.getSeatMapByEvent(1);
      console.log("✅ Seat Map:", data);
    } catch (err: any) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Integration Test</h1>

      <div className="space-y-4">
        <button
          onClick={testGetBookings}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          Test Get My Bookings
        </button>

        <button
          onClick={testGetSeatMap}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={loading}
        >
          Test Get Seat Map (Event 1)
        </button>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(bookings, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

Add route trong `Router.tsx`:

```typescript
import { APITest } from "./pages/APITest";

// Add route
{
  page === "api-test" && <APITest />;
}
```

Navigate to: http://localhost:5173?page=api-test

---

### **BƯỚC 5: Tích Hợp Page Đầu Tiên - Checkout.tsx**

**File:** `Source/frontend/src/pages/Checkout.tsx`

**BEFORE (Mock):**

```typescript
const handlePlaceOrder = async () => {
  // Simulate API call
  setTimeout(() => {
    onNavigate("success");
  }, 1000);
};
```

**AFTER (Real API):**

```typescript
import { useState } from "react";
import { bookingService, CreateBookingDto } from "../services";
import { useToast } from "../components/ui/use-toast";

export function Checkout({ onNavigate }: CheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePlaceOrder = async () => {
    try {
      setIsProcessing(true);

      // Prepare booking data
      const bookingData: CreateBookingDto = {
        eventId: Number(eventId),
        ticketTypeId: selectedTier.id,
        quantity: cart.length,
        seatIds: selectedSeats.map((s) => s.id), // Nếu có chỗ ngồi
        promoCode: promoCode || undefined,
      };

      // Call API
      const result = await bookingService.createBooking(bookingData);

      // Success - Store booking ID and redirect
      localStorage.setItem("lastBookingId", result.bookingId.toString());
      localStorage.setItem("bookingCode", result.bookingCode);

      toast({
        title: "Đặt vé thành công!",
        description: `Mã đặt vé: ${result.bookingCode}`,
      });

      onNavigate("success");
    } catch (error: any) {
      console.error("Booking failed:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Đặt vé thất bại. Vui lòng thử lại.";

      toast({
        variant: "destructive",
        title: "Lỗi",
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* ... existing UI ... */}

      <Button onClick={handlePlaceOrder} disabled={isProcessing}>
        {isProcessing ? "Đang xử lý..." : "Đặt vé"}
      </Button>
    </div>
  );
}
```

**Test Flow:**

1. Chọn event → Add to cart
2. Click Checkout
3. Fill form → Click "Đặt vé"
4. Check Network tab (F12) → Xem request/response
5. Verify booking created in database

---

## 📋 CHECKLIST TÍCH HỢP

### Phase 1: Setup ✅

- ✅ API services created
- ✅ Environment config (.env.local)
- ⏸️ Backend SQL script executed
- ⏸️ Test APIs in Swagger
- ⏸️ Test API services in frontend

### Phase 2: Core Booking Flow 🔄

Priority pages to integrate:

1. ⏸️ **SeatSelection.tsx**

   ```typescript
   // Replace mock data
   const { data: seatMap } = await seatMapService.getSeatMapByEvent(eventId);

   // Reserve seats on selection
   await seatMapService.reserveSeats(seatMapId, selectedSeatIds);
   ```

2. ⏸️ **Checkout.tsx** (Đã có template ở trên)

3. ⏸️ **Success.tsx**

   ```typescript
   const bookingId = localStorage.getItem("lastBookingId");
   const booking = await bookingService.getBookingDetails(bookingId);
   ```

4. ⏸️ **MyTickets.tsx**

   ```typescript
   const tickets = await ticketService.getMyTickets();
   ```

5. ⏸️ **TicketDetail.tsx**
   ```typescript
   const ticket = await ticketService.getTicketById(ticketId);
   ```

### Phase 3: Order Management 🔄

6. ⏸️ **OrderDetail.tsx** - `bookingService.getBookingDetails()`
7. ⏸️ **TransferTicket.tsx** - `ticketService.transferTicket()`
8. ⏸️ **RefundRequest.tsx** - `bookingService.cancelBooking()`

---

## 🔧 TROUBLESHOOTING

### Lỗi CORS

Nếu gặp CORS error:

**Backend:** Check `Program.cs`

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

### SSL Certificate Error

Nếu gặp lỗi SSL khi call HTTPS:

**Option 1:** Dùng HTTP thay vì HTTPS

```
VITE_API_BASE_URL=http://localhost:5129/api
```

**Option 2:** Trust certificate (Windows)

```bash
dotnet dev-certs https --trust
```

### 401 Unauthorized

Cần JWT token:

```typescript
// After login, store token
localStorage.setItem("authToken", response.data.token);

// apiClient sẽ tự động add token vào headers
```

### Network Error

Check:

1. Backend server có đang chạy? (port 5129/7129)
2. Firewall có block không?
3. URL trong .env.local đúng chưa?

---

## 📊 PROGRESS TRACKING

### Backend: ✅ 100% Complete (27 endpoints)

- Booking: 6/6 ✅
- Ticket: 8/8 ✅
- Seat Management: 7/7 ✅
- PromoCode: 5/5 ✅

### Frontend Integration: 🔄 In Progress

- API Services: 5/5 ✅
- Environment Setup: 1/1 ✅
- Database Migration: 0/1 ⏸️
- Pages Integrated: 0/30 ⏸️

**Next Steps:**

1. ⏸️ Run SQL migration script
2. ⏸️ Test APIs in Swagger
3. ⏸️ Test API services in frontend
4. ⏸️ Integrate Checkout.tsx (first page)
5. ⏸️ Integrate remaining booking flow pages

---

## 📞 SUPPORT

**Documentation:**

- Backend: `Source/backend/Tickify/Tickify/SEAT_MANAGEMENT_SETUP.md`
- Integration: `Source/FRONTEND_BACKEND_INTEGRATION_STATUS.md`
- Figma: `FIGMA_SEAT_SELECTION_PROMPT.md`

**Swagger:**

- https://localhost:7129/swagger

**Developer 3 APIs:**

- Booking: `/api/booking`
- Ticket: `/api/ticket`
- Seat Maps: `/api/seatmaps`
- Promo Codes: `/api/promocodes`

---

**Ready to Start Integration! 🚀**
