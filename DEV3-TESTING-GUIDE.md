# 🧪 Hướng dẫn Test Chức năng Dev 3 - Booking & Ticket APIs

## 📋 Tổng quan

Dev 3 đã hoàn thành:

- ✅ 21 Booking & Ticket APIs (Backend)
- ✅ 4 Frontend Pages: Cart, Checkout, Success, MyTickets

---

## 🚀 Bước 1: Chuẩn bị môi trường

### 1.1. Dừng ứng dụng đang chạy

```powershell
# Tìm process đang chạy
Get-Process | Where-Object {$_.ProcessName -like "*Tickify*"}

# Dừng process (thay PID bằng số thực tế)
Stop-Process -Id 25660 -Force
```

### 1.2. Build lại project

```powershell
cd "d:\!course\FPT\Tickify\tickify-event-management\Source\backend\Tickify\Tickify"
dotnet build
```

### 1.3. Chạy backend API

```powershell
dotnet run
# Hoặc dùng watch mode để auto-reload
dotnet watch run
```

Backend sẽ chạy tại: **http://localhost:5000** hoặc **https://localhost:5001**

### 1.4. Chạy frontend (Terminal mới)

```powershell
cd "d:\!course\FPT\Tickify\tickify-event-management\Source\frontend"
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

---

## 🧪 Bước 2: Test Backend APIs qua Swagger

Truy cập: **http://localhost:5000** (Swagger UI sẽ mở)

### 2.1. Test Authentication (Bắt buộc trước khi test)

#### **Login để lấy JWT Token**

```http
POST /api/Auth/login
Content-Type: application/json

{
  "email": "user@tickify.com",
  "password": "User123!"
}
```

**Response sẽ trả về:**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "userId": 4,
    "email": "user@tickify.com",
    "roles": ["User"]
  }
}
```

#### **Authorize trong Swagger**

1. Click nút **🔓 Authorize** (góc trên bên phải)
2. Nhập: `Bearer eyJhbGciOiJIUzI1NiIs...` (thay bằng token thực)
3. Click **Authorize** → **Close**

---

### 2.2. Test Booking APIs (11 endpoints)

#### ✅ **1. Create Booking - Tạo booking mới**

```http
POST /api/Booking
Authorization: Bearer {token}

{
  "eventId": 1,
  "tickets": [
    {
      "ticketTypeId": 1,
      "quantity": 2,
      "seatIds": null
    }
  ],
  "promoCode": null
}
```

**Kiểm tra:**

- ✅ Response trả về booking với `bookingCode`
- ✅ Status = `Pending` (0)
- ✅ `ExpiresAt` = 15 phút sau
- ✅ `TotalAmount` được tính đúng

---

#### ✅ **2. Get My Bookings - Lấy danh sách booking của user**

```http
GET /api/Booking/my-bookings
Authorization: Bearer {token}
```

**Kiểm tra:**

- ✅ Trả về list bookings của user đăng nhập
- ✅ Có pagination (pageIndex, pageSize, totalCount)
- ✅ Hiển thị đầy đủ thông tin event, tickets

---

#### ✅ **3. Get Booking by ID**

```http
GET /api/Booking/{bookingId}
Authorization: Bearer {token}
```

**Kiểm tra:**

- ✅ Trả về chi tiết booking
- ✅ Có thông tin tickets, event, payment
- ✅ Chỉ user sở hữu mới xem được

---

#### ✅ **4. Cancel Booking**

```http
POST /api/Booking/{bookingId}/cancel
Authorization: Bearer {token}

{
  "reason": "Không thể tham dự"
}
```

**Kiểm tra:**

- ✅ Status chuyển thành `Cancelled`
- ✅ Tickets được release (số lượng available tăng)
- ✅ Không cancel được nếu đã thanh toán

---

#### ✅ **5. Get Booking by Code**

```http
GET /api/Booking/code/{bookingCode}
Authorization: Bearer {token}
```

---

#### ✅ **6. Validate Promo Code**

```http
POST /api/Booking/validate-promo
Authorization: Bearer {token}

{
  "code": "SUMMER2024",
  "eventId": 1,
  "totalAmount": 500000
}
```

**Kiểm tra:**

- ✅ Trả về discount amount
- ✅ Validate expired, max uses, minimum purchase

---

#### ✅ **7-11. Admin APIs** (Cần token Admin/Staff)

Login với admin account:

```json
{
  "email": "admin@tickify.com",
  "password": "Admin123!"
}
```

- `GET /api/Booking/all` - Lấy tất cả bookings
- `GET /api/Booking/expired` - Booking hết hạn
- `POST /api/Booking/{id}/confirm` - Xác nhận booking
- `GET /api/Booking/statistics` - Thống kê bookings
- `GET /api/Booking/export` - Export Excel

---

### 2.3. Test Ticket APIs (10 endpoints)

#### ✅ **1. Get My Tickets**

```http
GET /api/Ticket/my-tickets
Authorization: Bearer {token}
```

**Kiểm tra:**

- ✅ Trả về tất cả tickets của user
- ✅ Filter theo status: `Unused`, `Used`, `Cancelled`
- ✅ Có thông tin event, booking

---

#### ✅ **2. Get Ticket by ID**

```http
GET /api/Ticket/{ticketId}
Authorization: Bearer {token}
```

**Kiểm tra:**

- ✅ Trả về chi tiết ticket
- ✅ Có QR code data
- ✅ Thông tin event, seat, booking

---

#### ✅ **3. Get Ticket by Code**

```http
GET /api/Ticket/code/{ticketCode}
Authorization: Bearer {token}
```

---

#### ✅ **4. Download Ticket PDF**

```http
GET /api/Ticket/{ticketId}/download
Authorization: Bearer {token}
```

**Kiểm tra:**

- ✅ Trả về file PDF
- ✅ Content-Type: application/pdf
- ✅ Chứa QR code, thông tin event, ticket

---

#### ✅ **5. Validate Ticket**

```http
POST /api/Ticket/{ticketId}/validate
Authorization: Bearer {token}
```

**Kiểm tra:**

- ✅ Trả về `isValid: true/false`
- ✅ Message giải thích trạng thái
- ✅ Check expired, used, cancelled

---

#### ✅ **6. Use Ticket (Scan QR)**

```http
POST /api/Ticket/{ticketId}/use
Authorization: Bearer {token}

{
  "scanLocation": "Main Entrance",
  "scanType": "Entry",
  "deviceId": "SCANNER-001"
}
```

**Kiểm tra:**

- ✅ Status chuyển thành `Used`
- ✅ `UsedAt` được ghi lại
- ✅ Tạo record TicketScan
- ✅ Không thể scan lại ticket đã dùng

---

#### ✅ **7. Transfer Ticket**

```http
POST /api/Ticket/{ticketId}/transfer
Authorization: Bearer {token}

{
  "toUserEmail": "user2@example.com",
  "reason": "Tặng bạn"
}
```

**Kiểm tra:**

- ✅ Tạo TicketTransfer record
- ✅ Gửi email thông báo cho người nhận
- ✅ Chỉ transfer được ticket chưa dùng

---

#### ✅ **8. Get Ticket Transfers**

```http
GET /api/Ticket/{ticketId}/transfers
Authorization: Bearer {token}
```

---

#### ✅ **9. Get Scan History**

```http
GET /api/Ticket/{ticketId}/scans
Authorization: Bearer {token}
```

**Kiểm tra:**

- ✅ Trả về lịch sử scan
- ✅ Hiển thị location, time, device

---

#### ✅ **10. Get All Tickets (Admin)**

```http
GET /api/Ticket/all
Authorization: Bearer {admin-token}
```

---

## 🌐 Bước 3: Test Frontend Pages

### 3.1. Test Cart Page (`/cart`)

**Truy cập:** http://localhost:5173/cart

**Test cases:**

1. ✅ Hiển thị danh sách tickets trong cart
2. ✅ Tăng/giảm số lượng ticket
3. ✅ Xóa ticket khỏi cart
4. ✅ Apply promo code
5. ✅ Hiển thị tổng tiền chính xác
6. ✅ Nút "Proceed to Checkout" dẫn đến `/checkout`
7. ✅ Cart trống hiển thị message phù hợp

**Cách test:**

```javascript
// 1. Thêm ticket vào cart từ Event Detail page
// 2. Vào /cart
// 3. Thay đổi số lượng → check tổng tiền
// 4. Apply code "SUMMER2024" → check discount
// 5. Xóa 1 item → check cart update
```

---

### 3.2. Test Checkout Page (`/checkout`)

**Truy cập:** http://localhost:5173/checkout

**Test cases:**

1. ✅ Hiển thị summary booking từ cart
2. ✅ Form nhập thông tin người đặt
3. ✅ Validate email, phone format
4. ✅ Chọn payment method (VNPay/MoMo)
5. ✅ Nút "Confirm & Pay" gọi API create booking
6. ✅ Redirect đến payment gateway (VNPay sandbox)
7. ✅ Hold timer 15 phút hiển thị

**Cách test:**

```javascript
// 1. Có items trong cart → vào /checkout
// 2. Điền form thông tin
// 3. Chọn VNPay → click "Confirm & Pay"
// 4. Kiểm tra redirect đến VNPay sandbox
// 5. Quay lại bằng ReturnUrl → check booking status
```

---

### 3.3. Test Success Page (`/success`)

**Truy cập:** http://localhost:5173/success?bookingId=1

**Test cases:**

1. ✅ Hiển thị thông báo success
2. ✅ Hiển thị booking code, total amount
3. ✅ Danh sách tickets vừa mua
4. ✅ Nút "Download Tickets" (gọi API download PDF)
5. ✅ Nút "View My Tickets" dẫn đến `/my-tickets`
6. ✅ Nút "Back to Home"

**Cách test:**

```javascript
// 1. Hoàn thành checkout thành công
// 2. Tự động redirect đến /success?bookingId=X
// 3. Check hiển thị đầy đủ thông tin
// 4. Click download → check file PDF
```

---

### 3.4. Test My Tickets Page (`/my-tickets`)

**Truy cập:** http://localhost:5173/my-tickets

**Test cases:**

1. ✅ Hiển thị danh sách tickets của user
2. ✅ Filter theo status: All, Unused, Used, Expired
3. ✅ Search theo event name, ticket code
4. ✅ Mỗi ticket hiển thị QR code
5. ✅ Click ticket → xem chi tiết
6. ✅ Nút "Download Ticket" cho từng ticket
7. ✅ Nút "Transfer Ticket" (chưa dùng)
8. ✅ Pagination cho danh sách dài

**Cách test:**

```javascript
// 1. Login → vào /my-tickets
// 2. Kiểm tra list tickets hiển thị
// 3. Filter "Used" → chỉ show tickets đã dùng
// 4. Search "Concert" → filter theo tên event
// 5. Click 1 ticket → xem detail modal/page
// 6. Download PDF → check file
// 7. Transfer ticket → điền email người nhận
```

---

## 🐛 Bước 4: Test Error Cases

### 4.1. Booking Errors

- ❌ Create booking without login → 401 Unauthorized
- ❌ Create booking với invalid ticketTypeId → 404 Not Found
- ❌ Create booking khi sold out → 400 Bad Request
- ❌ Cancel booking đã paid → 400 Cannot cancel paid booking
- ❌ Apply invalid promo code → 400 Invalid promo code

### 4.2. Ticket Errors

- ❌ Get ticket của user khác → 403 Forbidden
- ❌ Use ticket đã used → 400 Ticket already used
- ❌ Transfer ticket đã used → 400 Cannot transfer used ticket
- ❌ Download ticket chưa paid → 400 Booking not paid

---

## 📊 Bước 5: Kiểm tra Database

### 5.1. Check Bookings Table

```sql
SELECT TOP 10 * FROM [dbo].[Bookings]
ORDER BY BookingDate DESC
```

**Verify:**

- ✅ Status: 0=Pending, 1=Confirmed, 2=Cancelled
- ✅ ExpiresAt được set
- ✅ TotalAmount, DiscountAmount đúng

### 5.2. Check Tickets Table

```sql
SELECT * FROM [dbo].[Tickets]
WHERE BookingId = 1
```

**Verify:**

- ✅ TicketCode unique
- ✅ Status: 0=Unused, 1=Used, 2=Cancelled, 3=Expired
- ✅ Price đúng với TicketType
- ✅ UsedAt được ghi khi scan

### 5.3. Check TicketScans Table

```sql
SELECT * FROM [dbo].[TicketScans]
WHERE TicketId = 1
ORDER BY ScannedAt DESC
```

**Verify:**

- ✅ Ghi lại mỗi lần scan
- ✅ Location, Device, ScanType

### 5.4. Check TicketTransfers Table

```sql
SELECT * FROM [dbo].[TicketTransfers]
WHERE TicketId = 1
```

**Verify:**

- ✅ FromUserId, ToUserId đúng
- ✅ TransferredAt ghi lại

---

## ✅ Checklist Tổng hợp

### Backend APIs (21 endpoints)

- [ ] 11 Booking APIs hoạt động
- [ ] 10 Ticket APIs hoạt động
- [ ] Authentication JWT working
- [ ] Authorization roles (Admin/User) working
- [ ] Validation errors trả về đúng
- [ ] Database updates correctly

### Frontend Pages (4 pages)

- [ ] Cart page: add/remove/update items
- [ ] Checkout page: form validation, payment redirect
- [ ] Success page: show booking details
- [ ] My Tickets page: list, filter, download, transfer

### Integration

- [ ] Cart → Checkout flow
- [ ] Checkout → Payment gateway
- [ ] Payment → Success page
- [ ] My Tickets → Download PDF
- [ ] My Tickets → Transfer ticket

---

## 🎯 Test Priority

### High Priority (Must test)

1. ✅ Login/Authentication
2. ✅ Create booking flow end-to-end
3. ✅ My Tickets page display
4. ✅ Download ticket PDF
5. ✅ Use ticket (scan QR)

### Medium Priority

1. ✅ Cancel booking
2. ✅ Apply promo code
3. ✅ Transfer ticket
4. ✅ Filter/search tickets
5. ✅ Admin APIs

### Low Priority (Nice to have)

1. ✅ Export bookings Excel
2. ✅ Booking statistics
3. ✅ Scan history
4. ✅ Transfer history

---

## 🔧 Troubleshooting

### Lỗi thường gặp:

**1. 401 Unauthorized**

- Check JWT token đã expired chưa
- Re-login để lấy token mới

**2. 500 Internal Server Error**

- Check database connection string
- Check service registration trong Program.cs

**3. Cannot create booking**

- Check event có TicketTypes chưa
- Check AvailableQuantity > 0

**4. PDF không download**

- Check Azure Storage connection string
- Check QRCoder package installed

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. **Terminal logs** của backend (dotnet run)
2. **Browser Console** của frontend (F12)
3. **Database** xem data có insert không
4. **Swagger** test API trực tiếp

---

## 🎉 Hoàn thành!

Sau khi test xong tất cả các bước trên, Dev 3 đã hoàn thành:

- ✅ 21 Backend APIs working
- ✅ 4 Frontend pages functional
- ✅ Integration với Payment gateway
- ✅ QR code generation & scanning
- ✅ Ticket transfer system

**Good luck testing! 🚀**
