# 🗺️ ROUTES QUICK REFERENCE

## Tất cả Routes trong Tickify

### 📍 Navigation Function

```tsx
onNavigate(page: string, id?: string)
```

---

## 🏠 PUBLIC PAGES

| Route          | Page Name           | Component    |
| -------------- | ------------------- | ------------ |
| `home`         | Trang chủ           | Home         |
| `listing`      | Danh sách sự kiện   | EventListing |
| `event-detail` | Chi tiết sự kiện    | EventDetail  |
| `cart`         | Giỏ hàng            | Cart         |
| `checkout`     | Thanh toán          | Checkout     |
| `success`      | Đơn hàng thành công | Success      |
| `wishlist`     | Wishlist            | Wishlist     |
| `waitlist`     | Waitlist            | Waitlist     |

---

## 🎫 TICKET MANAGEMENT

| Route             | Page Name         | Component      | Params   |
| ----------------- | ----------------- | -------------- | -------- |
| `my-tickets`      | Vé của tôi        | MyTickets      | -        |
| `order-detail`    | Chi tiết đơn hàng | OrderDetail    | orderId  |
| `ticket-detail`   | Chi tiết vé       | TicketDetail   | ticketId |
| `transfer-ticket` | Chuyển vé         | TransferTicket | ticketId |
| `seat-selection`  | Chọn ghế          | SeatSelection  | eventId  |

---

## 👤 USER PROFILE

| Route                      | Page Name         | Component               |
| -------------------------- | ----------------- | ----------------------- |
| `user-profile`             | Hồ sơ             | UserProfile             |
| `password-change`          | Đổi mật khẩu      | PasswordChange          |
| `notifications`            | Thông báo         | Notifications           |
| `notification-preferences` | Cài đặt thông báo | NotificationPreferences |

---

## 🎭 ORGANIZER

| Route                 | Page Name         | Component           | Params  |
| --------------------- | ----------------- | ------------------- | ------- |
| `organizer-wizard`    | Đăng ký Organizer | OrganizerWizard     | -       |
| `organizer-dashboard` | Dashboard         | OrganizerDashboard  | -       |
| `event-management`    | Quản lý sự kiện   | EventManagement     | -       |
| `edit-event`          | Chỉnh sửa sự kiện | EditEvent           | eventId |
| `event-analytics`     | Phân tích         | EventAnalytics      | eventId |
| `promo-codes`         | Mã giảm giá       | PromoCodeManagement | -       |
| `qr-scanner`          | Quét QR           | QRScanner           | -       |
| `scan-history`        | Lịch sử quét      | ScanHistory         | -       |

---

## 🛡️ ADMIN

| Route             | Page Name       | Component      |
| ----------------- | --------------- | -------------- |
| `admin-dashboard` | Admin Dashboard | AdminDashboard |

---

## 🔐 AUTHENTICATION

| Route                | Page Name        | Component         |
| -------------------- | ---------------- | ----------------- |
| `login`              | Đăng nhập        | Login             |
| `register`           | Đăng ký          | Register          |
| `forgot-password`    | Quên mật khẩu    | ForgotPassword    |
| `reset-password`     | Đặt lại mật khẩu | ResetPassword     |
| `email-verification` | Xác thực email   | EmailVerification |

---

## 📝 REVIEW & REFUND

| Route               | Page Name         | Component        | Params  |
| ------------------- | ----------------- | ---------------- | ------- |
| `review-submission` | Đánh giá          | ReviewSubmission | eventId |
| `event-reviews`     | Xem reviews       | EventReviews     | eventId |
| `refund-request`    | Yêu cầu hoàn tiền | RefundRequest    | orderId |

---

## 📌 EXAMPLES

```tsx
// Navigate to home
onNavigate("home");

// Navigate with ID
onNavigate("event-detail", "evt-001");
onNavigate("ticket-detail", "tkt-123");
onNavigate("order-detail", "ord-456");

// From component
<Button onClick={() => onNavigate("my-tickets")}>My Tickets</Button>;
```

---

## 🔢 TOTAL PAGES: **38**

- Public: 8
- Tickets: 5
- User: 4
- Organizer: 8
- Admin: 1
- Auth: 5
- Review/Refund: 3
- Standalone: 4 (Home, EditEvent, EventDetailPage, HomePage - có page trùng tên)

**Status:** ✅ All pages implemented and working!
