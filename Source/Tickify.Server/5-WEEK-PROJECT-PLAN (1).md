# 🚀 5-Week Project Plan (REVISED) - Tickify Event Management

## Team: 4 Developers | Timeline: Oct 30 - Dec 3, 2025

## Testing: Dec 4, 2025 (Riêng 1 ngày sau khi hoàn thành)

---

## 📋 **Nguyên tắc làm việc**

### ✅ **Setup cùng nhau:**

- **Day 1:** Cả 4 người cùng install packages, setup infrastructure (Backend + Frontend)
- **Day 1:** Cả 4 người cùng tạo folders, common classes, middleware

### ✅ **Chia công đều - Song Song Backend + Frontend:**

- Mỗi developer phụ trách 1 domain Backend + Frontend pages tương ứng
- Số lượng công việc cân bằng (~25 APIs + 12 pages/người)
- Testing để riêng 1 ngày sau khi hoàn thành

### ✅ **4 Developers - Full Stack:**

**Developer 1:** Authentication & User

- Backend: Auth APIs (7) + User APIs (8) + Notification (4) = 19 endpoints
- Frontend: Auth pages (4) + Profile (3) + Notifications (2) = 9 pages

**Developer 2:** Events & Categories

- Backend: Events (14) + Categories (4) + Organizers (7) + Support (8) = 33 endpoints
- Frontend: Event pages (3) + Organizer pages (6) + Support (3) = 12 pages

**Developer 3:** Bookings & Tickets

- Backend: Bookings (6) + Tickets (8) + Seats (5) + PromoCode (5) + Scan (3) = 27 endpoints
- Frontend: Booking flow (5) + Tickets (3) + Seat selection (1) + Wishlist/Waitlist (2) = 11 pages

**Developer 4:** Payments & Reviews

- Backend: Payments (5) + Reviews (6) + Refunds (6) + Payouts (6) + Waitlist (5) + Wishlist (5) = 33 endpoints
- Frontend: Payment (2) + Review (2) + Refund (2) + Admin (7) + Static (6) = 19 pages

---

# **WEEK 1: Setup & DTOs** (Oct 30 - Nov 5, 2025)

## **📦 Day 1 (Oct 30): Setup Infrastructure - CẢ 4 NGƯỜI CÙNG LÀM**

### **Morning (9:00 - 12:00): Install All Packages**

```bash
# Authentication & Security
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package System.IdentityModel.Tokens.Jwt
dotnet add package BCrypt.Net-Next

# Validation & Mapping
dotnet add package FluentValidation.AspNetCore
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection

# Email Service
dotnet add package MailKit

# File Upload
dotnet add package Azure.Storage.Blobs

# QR Code
dotnet add package QRCoder

# Background Jobs
dotnet add package Hangfire.AspNetCore
dotnet add package Hangfire.SqlServer

# Payment
dotnet add package Stripe.net

# Logging
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.File

# Real-time
dotnet add package Microsoft.AspNetCore.SignalR

# Testing
dotnet add package xUnit
dotnet add package Moq
```

### **Afternoon (13:00 - 17:00): Create Infrastructure**

**Tasks cả team cùng làm:**

1. ✅ Create folder structure (DTOs/, Validators/, Exceptions/, Middleware/, etc.)
2. ✅ Create `Common/ApiResponse.cs`
3. ✅ Create `Common/PagedResult.cs`
4. ✅ Create 5 custom exceptions
5. ✅ Create `Middleware/ExceptionHandlingMiddleware.cs`
6. ✅ Configure JWT in `Program.cs`
7. ✅ Configure AutoMapper in `Program.cs`
8. ✅ Configure Swagger in `Program.cs`
9. ✅ Update `appsettings.json` (JWT, Email, Azure, Stripe settings)
10. ✅ Test build thành công

**End of Day 1:** ✅ Infrastructure hoàn chỉnh, sẵn sàng code

---

## **Days 2-5 (Oct 31 - Nov 5): DTOs/Validators + First Frontend Pages**

### **Developer 1: Auth/User Backend + Auth Frontend Pages**

**Backend DTOs (20):**

**Authentication DTOs:**

- `DTOs/Auth/RegisterDto.cs`
- `DTOs/Auth/LoginDto.cs`
- `DTOs/Auth/LoginResponse.cs`
- `DTOs/Auth/RefreshTokenDto.cs`
- `DTOs/Auth/ForgotPasswordDto.cs`
- `DTOs/Auth/ResetPasswordDto.cs`
- `DTOs/Auth/VerifyEmailDto.cs`
- `DTOs/Auth/ChangePasswordDto.cs`

**User DTOs:**

- `DTOs/User/UserDto.cs`
- `DTOs/User/UserDetailDto.cs`
- `DTOs/User/UserListDto.cs`
- `DTOs/User/UpdateUserDto.cs`
- `DTOs/User/UserProfileDto.cs`
- `DTOs/User/AssignRoleDto.cs`

**Role DTOs:**

- `DTOs/Role/RoleDto.cs`
- `DTOs/Role/CreateRoleDto.cs`

**Validators (8):**

- `Validators/Auth/RegisterDtoValidator.cs`
- `Validators/Auth/LoginDtoValidator.cs`
- `Validators/Auth/ChangePasswordDtoValidator.cs`
- `Validators/Auth/ResetPasswordDtoValidator.cs`
- `Validators/User/UpdateUserValidator.cs`
- `Validators/User/AssignRoleValidator.cs`

**Services Foundation:**

- `Services/JwtService.cs` (interface + implementation)
- `Services/EmailService.cs` (interface + implementation)
- Email templates: `Welcome.html`, `VerifyEmail.html`, `PasswordReset.html`

**Mapping:**

- Update `Mappings/MappingProfile.cs` cho User, Role

**Frontend Pages (4):**

✅ `pages/Login.tsx` - Login form with validation
✅ `pages/Register.tsx` - Register form with validation  
✅ `pages/ForgotPassword.tsx` - Forgot password form
🆕 `pages/ResetPassword.tsx` - Reset password with token
🆕 `pages/VerifyEmail.tsx` - Email verification page

---

### **Developer 2: Event/Category Backend + Event Frontend Pages**

**Backend DTOs (18):**

**Event DTOs:**

- `DTOs/Event/CreateEventDto.cs`
- `DTOs/Event/UpdateEventDto.cs`
- `DTOs/Event/EventListDto.cs`
- `DTOs/Event/EventDetailDto.cs`
- `DTOs/Event/EventCardDto.cs`
- `DTOs/Event/PublishEventDto.cs`
- `DTOs/Event/ApproveEventDto.cs`
- `DTOs/Event/RejectEventDto.cs`

**TicketType DTOs:**

- `DTOs/TicketType/CreateTicketTypeDto.cs`
- `DTOs/TicketType/UpdateTicketTypeDto.cs`
- `DTOs/TicketType/TicketTypeDto.cs`
- `DTOs/TicketType/TicketTypeDetailDto.cs`

**Category DTOs:**

- `DTOs/Category/CategoryDto.cs`
- `DTOs/Category/CreateCategoryDto.cs`
- `DTOs/Category/UpdateCategoryDto.cs`

**Organizer DTOs:**

- `DTOs/Organizer/OrganizerDto.cs`
- `DTOs/Organizer/CreateOrganizerDto.cs`
- `DTOs/Organizer/OrganizerProfileDto.cs`

**Validators (6):**

- `Validators/Event/CreateEventValidator.cs`
- `Validators/Event/UpdateEventValidator.cs`
- `Validators/TicketType/CreateTicketTypeValidator.cs`
- `Validators/Category/CreateCategoryValidator.cs`
- `Validators/Organizer/CreateOrganizerValidator.cs`

**Mapping:**

- Update `Mappings/MappingProfile.cs` cho Event, TicketType, Category, Organizer

**Frontend Pages (3):**

✅ `pages/EventListing.tsx` - List all events with filters
✅ `pages/EventDetail.tsx` - Event details page
✅ `pages/Home.tsx` - Home page with featured events

---

### **Developer 3: Booking/Ticket Backend + Booking Frontend Pages**

**Backend DTOs (16):**

**Booking DTOs:**

- `DTOs/Booking/CreateBookingDto.cs`
- `DTOs/Booking/BookingDto.cs`
- `DTOs/Booking/BookingDetailDto.cs`
- `DTOs/Booking/BookingListDto.cs`
- `DTOs/Booking/CancelBookingDto.cs`
- `DTOs/Booking/BookingConfirmationDto.cs`

**Ticket DTOs:**

- `DTOs/Ticket/TicketDto.cs`
- `DTOs/Ticket/TicketDetailDto.cs`
- `DTOs/Ticket/TicketTransferDto.cs`
- `DTOs/Ticket/AcceptTransferDto.cs`
- `DTOs/Ticket/TicketScanDto.cs`

**Seat DTOs:**

- `DTOs/Seat/SeatDto.cs`
- `DTOs/Seat/CreateSeatDto.cs`
- `DTOs/Seat/SeatSelectionDto.cs`
- `DTOs/Seat/SeatMapDto.cs`

**PromoCode DTOs:**

- `DTOs/PromoCode/PromoCodeDto.cs`
- `DTOs/PromoCode/ValidatePromoCodeDto.cs`

**Validators (5):**

- `Validators/Booking/CreateBookingValidator.cs`
- `Validators/Ticket/TicketTransferValidator.cs`
- `Validators/Seat/CreateSeatValidator.cs`
- `Validators/PromoCode/ValidatePromoCodeValidator.cs`

**Services Foundation:**

- `Services/QRCodeService.cs` (interface + implementation)

**Mapping:**

- Update `Mappings/MappingProfile.cs` cho Booking, Ticket, Seat, PromoCode

**Frontend Pages (5):**

✅ `pages/Cart.tsx` - Shopping cart page
✅ `pages/Checkout.tsx` - Checkout form
✅ `pages/Success.tsx` - Payment success page
✅ `pages/MyTickets.tsx` - User's tickets list
🆕 `pages/SeatSelection.tsx` - Interactive seat map

---

### **Developer 4: Payment/Advanced Backend + Static Frontend Pages**

**Backend DTOs (22):**

**Payment DTOs:**

- `DTOs/Payment/CreatePaymentDto.cs`
- `DTOs/Payment/PaymentDto.cs`
- `DTOs/Payment/PaymentDetailDto.cs`
- `DTOs/Payment/PaymentIntentDto.cs`
- `DTOs/Payment/RefundDto.cs`

**Review DTOs:**

- `DTOs/Review/CreateReviewDto.cs`
- `DTOs/Review/UpdateReviewDto.cs`
- `DTOs/Review/ReviewDto.cs`
- `DTOs/Review/ReviewListDto.cs`

**Support DTOs:**

- `DTOs/Support/CreateSupportTicketDto.cs`
- `DTOs/Support/SupportTicketDto.cs`
- `DTOs/Support/SupportTicketDetailDto.cs`
- `DTOs/Support/AddMessageDto.cs`
- `DTOs/Support/SupportMessageDto.cs`

**Notification DTOs:**

- `DTOs/Notification/NotificationDto.cs`
- `DTOs/Notification/CreateNotificationDto.cs`

**Refund DTOs:**

- `DTOs/Refund/CreateRefundRequestDto.cs`
- `DTOs/Refund/RefundRequestDto.cs`
- `DTOs/Refund/ApproveRefundDto.cs`
- `DTOs/Refund/RejectRefundDto.cs`

**Waitlist DTOs:**

- `DTOs/Waitlist/JoinWaitlistDto.cs`
- `DTOs/Waitlist/WaitlistDto.cs`

**Payout DTOs:**

- `DTOs/Payout/PayoutDto.cs`
- `DTOs/Payout/RequestPayoutDto.cs`

**Validators (8):**

- `Validators/Payment/CreatePaymentValidator.cs`
- `Validators/Review/CreateReviewValidator.cs`
- `Validators/Review/UpdateReviewValidator.cs`
- `Validators/Support/CreateSupportTicketValidator.cs`
- `Validators/Refund/CreateRefundRequestValidator.cs`
- `Validators/Waitlist/JoinWaitlistValidator.cs`

**Services Foundation:**

- `Services/PaymentService.cs` (interface + implementation)
- `Services/NotificationService.cs` (interface + implementation)
- `Hubs/NotificationHub.cs` (SignalR hub)

**Mapping:**

- Update `Mappings/MappingProfile.cs` cho tất cả entities còn lại

**Frontend Pages (2):**

🆕 `pages/About.tsx` - About us static page
🆕 `pages/Contact.tsx` - Contact form page

---

**Week 1 Deliverables:**
✅ All packages installed (Day 1)
✅ Infrastructure complete (Day 1)
✅ 76+ DTOs created (chia đều 4 người)
✅ 32+ Validators created
✅ Service interfaces ready
✅ Mapping profiles complete
✅ 14 Frontend pages (12 existing + 2 new)
✅ Ready to implement APIs

---

# **WEEK 2: Core APIs + User Pages** (Nov 6 - Nov 12, 2025)

## **Developer 1: Auth/User APIs + Profile Frontend Pages**

**Backend APIs (22 endpoints):**

### **Authentication Controller (7 endpoints)**

- `POST /api/auth/register` - Register với email verification
- `POST /api/auth/login` - Login, trả về JWT token
- `POST /api/auth/refresh-token` - Refresh JWT
- `POST /api/auth/verify-email` - Verify email với token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password với token
- `POST /api/auth/logout` - Logout

**Implementation:**

- `Controllers/AuthController.cs`
- `Services/AuthService.cs`
- Email templates (HTML + CSS)
- JWT token generation & validation
- BCrypt password hashing

### **User Controller (8 endpoints)**

- `GET /api/users` - List users (Admin, pagination)
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/profile` - Current user profile (JWT)
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password
- `POST /api/users/{id}/assign-role` - Assign role (Admin)
- `PUT /api/users/{id}/toggle-active` - Activate/deactivate (Admin)
- `DELETE /api/users/{id}` - Soft delete (Admin)

**Implementation:**

- `Controllers/UserController.cs`
- `Services/UserService.cs`
- `Services/FileUploadService.cs` (avatar upload)
- Authorization với [Authorize] attribute
- Role-based access control

### **Notification Controller (4 endpoints)**

- `GET /api/notifications` - User notifications
- `POST /api/notifications/{id}/mark-read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all read
- `DELETE /api/notifications/{id}` - Delete notification

**Implementation:**

- `Controllers/NotificationController.cs`
- `Services/NotificationService.cs`
- SignalR hub for real-time push
- Helper methods: `NotifyBookingConfirmed()`, `NotifyEventApproved()`

### **TicketScan Controller (3 endpoints)**

- `POST /api/scan/validate` - Validate QR code
- `POST /api/scan/check-in` - Check-in ticket
- `GET /api/scan/event/{eventId}/history` - Scan history

**Implementation:**

- `Controllers/TicketScanController.cs`
- `Services/TicketScanService.cs`
- QR validation & prevent duplicate check-ins

**Deliverable:** ✅ 22 Authentication, User, Notification & Scan APIs

**Frontend Pages (4):**

🆕 `pages/Profile.tsx` - User profile view/edit
🆕 `pages/ChangePassword.tsx` - Change password form
🆕 `pages/UserDashboard.tsx` - User dashboard overview
🆕 `pages/OrderHistory.tsx` - User's order history

**Week 2 Deliverable (Dev 1):** 22 APIs + 4 Frontend Pages
**Độ khó:** 8/10 - Vừa phải, có real-time notification
**Điểm chấm:** 8.5/10 - JWT Authentication + Real-time (SignalR)

---

## **Developer 2: Event/Category APIs + Organizer Frontend Pages**

**Backend APIs (29 endpoints):**

### **Event Controller (14 endpoints)**

- `GET /api/events` - List events (public, filters, pagination)
- `GET /api/events/featured` - Featured events
- `GET /api/events/upcoming` - Upcoming events
- `GET /api/events/{id}` - Event details với ticket types
- `GET /api/events/search` - Search events
- `POST /api/events` - Create event (Organizer)
- `PUT /api/events/{id}` - Update event (Organizer/Admin)
- `POST /api/events/{id}/publish` - Publish event (Organizer)
- `POST /api/events/{id}/approve` - Approve event (Admin)
- `POST /api/events/{id}/reject` - Reject event (Admin)
- `POST /api/events/{id}/cancel` - Cancel event
- `DELETE /api/events/{id}` - Delete event (Admin)
- `GET /api/events/{id}/stats` - Event statistics
- `POST /api/events/{id}/duplicate` - Duplicate event

**Implementation:**

- `Controllers/EventController.cs`
- `Services/EventService.cs`
- Event status workflow (Draft → Pending → Approved → Published)
- Event approval email notification
- File upload for banner images

### **Category Controller (4 endpoints)**

- `GET /api/categories` - List all categories
- `GET /api/categories/{id}` - Category details
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/{id}` - Update category (Admin)

**Implementation:**

- `Controllers/CategoryController.cs`
- `Services/CategoryService.cs`

### **Organizer Controller (7 endpoints)**

- `POST /api/organizers/register` - Register as organizer
- `GET /api/organizers/{id}` - Organizer profile
- `PUT /api/organizers/{id}` - Update organizer profile
- `GET /api/organizers/{id}/events` - Organizer's events
- `GET /api/organizers/{id}/earnings` - Earnings dashboard
- `POST /api/organizers/{id}/verify` - Verify organizer (Admin)
- `GET /api/organizers` - List organizers (Admin)

**Implementation:**

- `Controllers/OrganizerController.cs`
- `Services/OrganizerService.cs`
- Verification workflow

### **Support Controller (4 endpoints) - THÊM TỪ WEEK 3**

- `POST /api/support/tickets` - Create support ticket
- `GET /api/support/tickets` - List tickets (filter by status)
- `GET /api/support/tickets/{id}` - Ticket details
- `POST /api/support/tickets/{id}/messages` - Add message

**Implementation:**

- `Controllers/SupportController.cs`
- `Services/SupportService.cs`
- Email notifications for ticket updates

**Deliverable:** ✅ 29 Event, Category, Organizer & Support APIs

**Frontend Pages (4):**

✅ `pages/OrganizerWizard.tsx` - Organizer registration wizard  
✅ `pages/OrganizerDashboard.tsx` - Organizer dashboard
🆕 `pages/OrganizerProfile.tsx` - Organizer profile page
🆕 `pages/CreateEvent.tsx` - Create new event form

**Week 2 Deliverable (Dev 2):** 29 APIs + 4 Frontend Pages
**Độ khó:** 7.5/10 - Nhiều endpoints nhưng logic rõ ràng
**Điểm chấm:** 8/10 - Event workflow + Organizer management

---

## **Developer 3: Booking & Ticket APIs (21 endpoints) ⭐ CRITICAL**

### **Booking Controller (6 endpoints)**

- `POST /api/bookings` - Create booking với seat selection ⭐ CRITICAL
- `GET /api/bookings/{id}` - Booking details
- `GET /api/bookings/my-bookings` - User's bookings
- `POST /api/bookings/{id}/cancel` - Cancel booking
- `GET /api/bookings/{id}/tickets` - Get tickets với QR codes
- `PUT /api/bookings/{id}/apply-promo` - Apply promo code

**Implementation:**

- `Controllers/BookingController.cs`
- `Services/BookingService.cs`
- **TRANSACTION LOCKING** để tránh race condition:

```csharp
using var transaction = await _context.Database
    .BeginTransactionAsync(IsolationLevel.Serializable);

// Lock seats
var seats = await _context.Seats
    .Where(s => seatIds.Contains(s.Id) && s.IsAvailable)
    .FromSqlRaw("SELECT * FROM Seats WITH (UPDLOCK, HOLDLOCK) WHERE ...")
    .ToListAsync();

// Validate & update
booking.ExpiresAt = DateTime.UtcNow.AddMinutes(15);
await transaction.CommitAsync();
```

### **Ticket Controller (8 endpoints)**

- `GET /api/tickets/{id}` - Ticket details
- `GET /api/tickets/my-tickets` - User's tickets
- `POST /api/tickets/{id}/transfer` - Transfer ticket
- `POST /api/tickets/transfers/{id}/accept` - Accept transfer
- `POST /api/tickets/transfers/{id}/reject` - Reject transfer
- `GET /api/tickets/{id}/qrcode` - Get QR code
- `POST /api/tickets/{id}/resend-email` - Resend ticket email
- `GET /api/tickets/event/{eventId}` - All tickets for event (Organizer)

**Implementation:**

- `Controllers/TicketController.cs`
- `Services/TicketService.cs`
- QR code generation
- Transfer workflow

### **Seat Controller (5 endpoints)**

- `GET /api/seats/event/{eventId}` - Seat map
- `GET /api/seats/ticket-type/{ticketTypeId}` - Available seats
- `POST /api/seats/bulk-create` - Create seats (Organizer)
- `PUT /api/seats/{id}/block` - Block seat (Admin)
- `PUT /api/seats/{id}/unblock` - Unblock seat (Admin)

**Implementation:**

- `Controllers/SeatController.cs`
- `Services/SeatService.cs`
- Bulk seat creation

### **PromoCode Controller (5 endpoints)**

- `POST /api/promocodes/validate` - Validate promo code
- `GET /api/promocodes` - List promo codes (Organizer/Admin)
- `POST /api/promocodes` - Create promo code (Organizer/Admin)
- `PUT /api/promocodes/{id}` - Update promo code
- `DELETE /api/promocodes/{id}` - Delete promo code

**Implementation:**

- `Controllers/PromoCodeController.cs`
- `Services/PromoCodeService.cs`
- Validation logic (dates, uses, minimum purchase)

**Deliverable:** ✅ 21 Booking, Ticket, Seat & PromoCode APIs

**Frontend Pages (4):**

🆕 `pages/OrderDetail.tsx` - Order detail with tickets
🆕 `pages/TicketDetail.tsx` - Single ticket view with QR
🆕 `pages/Wishlist.tsx` - User's wishlist
🆕 `pages/Waitlist.tsx` - User's waitlist entries

**Week 2 Deliverable (Dev 3):** 21 APIs + 4 Frontend Pages
**Độ khó:** 9/10 - 🔴 RẤT KHÓ - Transaction locking là CRITICAL
**Điểm chấm:** 9.5/10 - Booking system + Race condition handling (QUAN TRỌNG NHẤT!)

---

## **Developer 4: Payment/Review/Refund APIs + Static Pages**

**Backend APIs (23 endpoints):**

### **Payment Controller (5 endpoints)**

- `POST /api/payments/create-intent` - Create payment intent (Stripe)
- `POST /api/payments/webhook` - Payment webhook (Stripe/VNPay)
- `GET /api/payments/{id}` - Payment details
- `GET /api/payments/booking/{bookingId}` - Payments for booking
- `POST /api/payments/{id}/verify` - Verify payment

**Implementation:**

- `Controllers/PaymentController.cs`
- `Services/PaymentService.cs`
- Stripe integration
- Webhook signature validation
- Payment confirmation flow:
  1. Update Booking.Status = Confirmed
  2. Generate QR codes
  3. Send confirmation email
  4. Clear ExpiresAt

### **Review Controller (6 endpoints)**

- `POST /api/reviews` - Submit review (must attended)
- `GET /api/reviews/event/{eventId}` - Event reviews
- `GET /api/reviews/my-reviews` - User's reviews
- `PUT /api/reviews/{id}` - Update review
- `DELETE /api/reviews/{id}` - Delete review
- `GET /api/reviews/{id}` - Review details

**Implementation:**

- `Controllers/ReviewController.cs`
- `Services/ReviewService.cs`
- Validate attendance (check TicketScans)
- Update Event.AverageRating

### **Refund Controller (6 endpoints) - THÊM TỪ WEEK 3**

- `POST /api/refunds/request` - Request refund
- `GET /api/refunds` - List refund requests (Admin)
- `GET /api/refunds/{id}` - Refund details
- `GET /api/refunds/my-refunds` - User's refunds
- `POST /api/refunds/{id}/approve` - Approve refund (Admin)
- `POST /api/refunds/{id}/reject` - Reject refund (Admin)

**Implementation:**

- `Controllers/RefundController.cs`
- `Services/RefundService.cs`
- Validate eligibility, process via Stripe, send confirmation

**Deliverable:** ✅ 23 Payment, Review & Refund APIs

**Frontend Pages (4):**

🆕 `pages/WriteReview.tsx` - Write/edit review form
🆕 `pages/Reviews.tsx` - View event reviews
🆕 `pages/RefundRequest.tsx` - Request refund form
🆕 `pages/RefundHistory.tsx` - User's refund history

**Week 2 Deliverable (Dev 4):** 23 APIs + 4 Frontend Pages
**Độ khó:** 8.5/10 - Payment integration + Webhook handling
**Điểm chấm:** 9/10 - Payment (Stripe) + Webhook + Refund processing

---

**Week 2 Deliverables:**
✅ 22 Auth/User/Notification APIs + 4 Profile Pages (Dev 1)
✅ 29 Event/Category/Organizer/Support APIs + 4 Organizer Pages (Dev 2)
✅ 21 Booking/Ticket/Seat APIs + 4 Order Pages (Dev 3)
✅ 23 Payment/Review/Refund APIs + 4 Review/Refund Pages (Dev 4)
✅ **Total: 95 APIs + 30 Frontend pages (12 existing + 18 new)**

---

# **WEEK 3: Advanced Features + More Pages** (Nov 13 - Nov 19, 2025)

## **Developer 1: Admin Dashboard APIs + Notification Pages**

**Backend APIs (5 endpoints):**

### **Admin Dashboard (5 endpoints)**

- `GET /api/admin/dashboard/stats` - Overall statistics
- `GET /api/admin/dashboard/recent-bookings` - Recent bookings
- `GET /api/admin/dashboard/revenue` - Revenue chart data
- `GET /api/admin/dashboard/top-events` - Top selling events
- `GET /api/admin/dashboard/pending-approvals` - Pending approvals

**Implementation:**

- `Controllers/AdminController.cs`
- `Services/AdminService.cs`
- Aggregate data from multiple tables
- Chart data formatting

**Deliverable:** ✅ 5 Admin Dashboard APIs

**Frontend Pages (2):**

🆕 `pages/Notifications.tsx` - Notifications center
🆕 `pages/NotificationSettings.tsx` - Notification preferences

**Week 3 Deliverable (Dev 1):** 5 APIs + 2 Frontend Pages

---

## **Developer 2: Support/Waitlist/Wishlist APIs + Event Management Pages**

**Backend APIs (14 endpoints):**

### **Support Controller (Advanced - 4 endpoints)**

- `GET /api/support/tickets/my-tickets` - User's tickets
- `POST /api/support/tickets/{id}/assign` - Assign to staff (Admin)
- `POST /api/support/tickets/{id}/resolve` - Resolve ticket
- `PUT /api/support/tickets/{id}/priority` - Update priority (Admin)

**Implementation:**

- Complete Support system
- Priority queue management
- Real-time updates (SignalR)

### **Waitlist Controller (5 endpoints)**

- `POST /api/waitlist/join` - Join waitlist
- `GET /api/waitlist/my-waitlists` - User's waitlists
- `DELETE /api/waitlist/{id}` - Leave waitlist
- `GET /api/waitlist/event/{eventId}` - Event waitlist (Organizer)
- `POST /api/waitlist/notify/{eventId}` - Notify waitlist (Organizer)

**Implementation:**

- `Controllers/WaitlistController.cs`
- `Services/WaitlistService.cs`
- FIFO queue logic
- Auto-notify when tickets available
- Expiration (7 days)

### **Wishlist Controller (5 endpoints)**

- `POST /api/wishlist/add` - Add event to wishlist
- `GET /api/wishlist` - User's wishlist
- `DELETE /api/wishlist/{id}` - Remove from wishlist
- `GET /api/wishlist/check/{eventId}` - Check if event in wishlist
- `GET /api/wishlist/count` - Wishlist count

**Implementation:**

- `Controllers/WishlistController.cs`
- `Services/WishlistService.cs`
- Notify when event goes on sale

**Deliverable:** ✅ 14 Support (Advanced), Waitlist & Wishlist APIs

**Frontend Pages (3):**

🆕 `pages/EditEvent.tsx` - Edit event form
🆕 `pages/EventAnalytics.tsx` - Event analytics dashboard
🆕 `pages/ScanTicket.tsx` - QR code scanner for check-in

**Week 3 Deliverable (Dev 2):** 14 APIs + 3 Frontend Pages

---

## **Developer 3: Event Statistics APIs + Support Pages**

**Backend APIs (5 endpoints):**

### **Event Statistics (5 endpoints)**

- `GET /api/events/{id}/stats/sales` - Sales statistics
- `GET /api/events/{id}/stats/attendance` - Attendance stats
- `GET /api/events/{id}/stats/revenue` - Revenue breakdown
- `GET /api/events/{id}/stats/demographics` - User demographics
- `GET /api/events/{id}/export/report` - Export report (CSV/PDF)

**Implementation:**

- `Controllers/EventStatsController.cs`
- `Services/EventStatsService.cs`
- Complex queries với grouping
- CSV/PDF export
- Chart data formatting

**Deliverable:** ✅ 5 Event Statistics & Report APIs

**Frontend Pages (3):**

🆕 `pages/SupportCenter.tsx` - Support center main page
🆕 `pages/CreateSupportTicket.tsx` - Create support ticket
🆕 `pages/SupportTicketDetail.tsx` - View ticket details

**Week 3 Deliverable (Dev 3):** 5 APIs + 3 Frontend Pages

---

## **Developer 4: Payout System APIs + Admin Pages**

**Backend APIs (6 endpoints):**

### **Payout Controller (6 endpoints)**

- `GET /api/payouts` - List payouts (Organizer/Admin)
- `GET /api/payouts/{id}` - Payout details
- `POST /api/payouts/request` - Request payout (Organizer)
- `POST /api/payouts/{id}/approve` - Approve payout (Admin)
- `POST /api/payouts/{id}/reject` - Reject payout (Admin)
- `GET /api/payouts/organizer/{organizerId}/stats` - Payout statistics

**Implementation:**

- `Controllers/PayoutController.cs`
- `Services/PayoutService.cs`
- Calculate payout:

```csharp
var totalRevenue = event.Bookings
    .Where(b => b.Status == BookingStatus.Confirmed)
    .Sum(b => b.TotalAmount);

var platformFee = totalRevenue * 0.10m; // 10%
var organizerEarnings = totalRevenue - platformFee;
```

- Payout approval workflow
- Bank transfer integration (optional)

**Deliverable:** ✅ 6 Payout APIs

**Frontend Pages (3):**

🆕 `pages/OrganizerPayouts.tsx` - Organizer payout management
🆕 `pages/AdminDashboard.tsx` - Admin dashboard overview
🆕 `pages/ManageUsers.tsx` - Admin user management

**Week 3 Deliverable (Dev 4):** 6 APIs + 3 Frontend Pages

---

**Week 3 Deliverables:**
✅ 5 Admin Dashboard APIs + 2 Notification Pages (Dev 1)
✅ 14 Support/Waitlist/Wishlist APIs + 3 Event Management Pages (Dev 2)
✅ 5 Event Statistics APIs + 3 Support Pages (Dev 3)
✅ 6 Payout APIs + 3 Admin Pages (Dev 4)
✅ **Total: 30 APIs + 41 Frontend pages (30 existing + 11 new)**

**Tổng kết sau Week 3:**

- Developer 1: 27 endpoints + 6 pages (22+5 APIs, 4+2 pages)
- Developer 2: 43 endpoints + 7 pages (29+14 APIs, 4+3 pages)
- Developer 3: 26 endpoints + 7 pages (21+5 APIs, 4+3 pages)
- Developer 4: 29 endpoints + 7 pages (23+6 APIs, 4+3 pages)

---

# **WEEK 4: Background Jobs + Final Pages** (Nov 20 - Nov 26, 2025)

## **Cả team cùng làm Background Jobs (Morning)**

### **Setup Hangfire (Cả team - 2 hours)**

```csharp
// Program.cs
builder.Services.AddHangfire(config =>
    config.UseSqlServerStorage(connectionString));
builder.Services.AddHangfireServer();
app.UseHangfireDashboard("/hangfire");
```

### **Job 1: Booking Expiration (Developer 1)**

```csharp
// Jobs/BookingExpirationJob.cs
[AutomaticRetry(Attempts = 3)]
public async Task ExpireBookingsAsync()
{
    var expiredBookings = await _context.Bookings
        .Where(b => b.Status == BookingStatus.Pending &&
                    b.ExpiresAt < DateTime.UtcNow)
        .Include(b => b.Tickets)
            .ThenInclude(t => t.Seat)
        .ToListAsync();

    foreach (var booking in expiredBookings)
    {
        booking.Status = BookingStatus.Expired;
        foreach (var ticket in booking.Tickets)
        {
            if (ticket.Seat != null)
                ticket.Seat.IsAvailable = true; // Release seats
        }
    }

    await _context.SaveChangesAsync();
}
```

**Schedule:** Every 1 minute

### **Job 2: Event Completion (Developer 2)**

```csharp
// Jobs/EventCompletionJob.cs
public async Task CompleteEventsAsync()
{
    var completedEvents = await _context.Events
        .Where(e => e.EndDate < DateTime.UtcNow &&
                    e.Status == EventStatus.Published)
        .ToListAsync();

    foreach (var evt in completedEvents)
    {
        evt.Status = EventStatus.Completed;
        await _payoutService.CalculatePayoutAsync(evt.Id);
    }

    await _context.SaveChangesAsync();
}
```

**Schedule:** Every hour

### **Job 3: Waitlist Cleanup (Developer 3)**

```csharp
// Jobs/WaitlistCleanupJob.cs
public async Task CleanupWaitlistAsync()
{
    var expiredEntries = await _context.Waitlists
        .Where(w => w.ExpiresAt < DateTime.UtcNow && !w.HasPurchased)
        .ToListAsync();

    _context.Waitlists.RemoveRange(expiredEntries);
    await _context.SaveChangesAsync();
}
```

**Schedule:** Daily at 2 AM

### **Job 4: Send Email Reminders (Developer 4)**

```csharp
// Jobs/EmailReminderJob.cs
public async Task SendEventRemindersAsync()
{
    var tomorrow = DateTime.UtcNow.AddDays(1);
    var upcomingEvents = await _context.Events
        .Where(e => e.StartDate >= DateTime.UtcNow &&
                    e.StartDate <= tomorrow)
        .Include(e => e.Bookings)
            .ThenInclude(b => b.User)
        .ToListAsync();

    foreach (var evt in upcomingEvents)
    {
        foreach (var booking in evt.Bookings)
        {
            await _emailService.SendEventReminderAsync(
                booking.User.Email, evt.Name, evt.StartDate);
        }
    }
}
```

**Schedule:** Daily at 8 AM

---

## **Individual Tasks (Afternoon - Rest of Week) + Final Frontend Pages**

### **Developer 1: Testing + Static Pages**

**Backend:**

- Test payment webhooks
- Test email delivery
- Test JWT authentication
- Test real-time notifications (SignalR)

**Frontend Pages (4):**

🆕 `pages/Terms.tsx` - Terms of Service static page
🆕 `pages/Privacy.tsx` - Privacy Policy static page  
🆕 `pages/FAQ.tsx` - Frequently Asked Questions
🆕 `pages/NotFound.tsx` - 404 Not Found page

**Week 4 Deliverable (Dev 1):** Integration Tests + 4 Static Pages

### **Developer 2: Dashboard APIs + Admin Pages (5 endpoints)**

**Backend APIs:**

- `GET /api/admin/dashboard/stats` - Overall statistics
- `GET /api/admin/dashboard/recent-bookings` - Recent bookings
- `GET /api/admin/dashboard/revenue` - Revenue chart data
- `GET /api/admin/dashboard/top-events` - Top selling events
- `GET /api/admin/dashboard/pending-approvals` - Pending approvals

**Frontend Pages (2):**

🆕 `pages/ManageEvents.tsx` - Admin event management
🆕 `pages/ManageCategories.tsx` - Admin category management

**Week 4 Deliverable (Dev 2):** 5 Dashboard APIs + 2 Admin Pages

### **Developer 3: Event Stats APIs + Admin Pages (5 endpoints)**

**Backend APIs:**

- `GET /api/events/{id}/stats/sales` - Sales statistics
- `GET /api/events/{id}/stats/attendance` - Attendance stats
- `GET /api/events/{id}/stats/revenue` - Revenue breakdown
- `GET /api/events/{id}/stats/demographics` - User demographics
- `GET /api/events/{id}/export/report` - Export event report (CSV/PDF)

**Frontend Pages (2):**

🆕 `pages/ManagePayouts.tsx` - Admin payout management
🆕 `pages/Reports.tsx` - Analytics & reports dashboard

**Week 4 Deliverable (Dev 3):** 5 Statistics APIs + 2 Admin Pages

### **Developer 4: Booking Reports + Admin Pages (5 endpoints)**

**Backend APIs:**

- `GET /api/bookings/report/daily` - Daily bookings report
- `GET /api/bookings/report/monthly` - Monthly report
- `GET /api/bookings/report/by-event` - Bookings by event
- `GET /api/bookings/report/cancellations` - Cancellation report
- `GET /api/bookings/export` - Export bookings (CSV)

**Frontend Pages (2):**

🆕 `pages/ManageRefunds.tsx` - Admin refund management
🆗 **Testing concurrent bookings** - Race condition tests

**Week 4 Deliverable (Dev 4):** 5 Report APIs + 2 Admin Pages + Race Condition Tests

---

**Week 4 Deliverables:**
✅ 4 background jobs running (Hangfire)
✅ 15 dashboard & report APIs (5+5+5)
✅ Integration testing complete (Dev 1)
✅ Race condition tests (Dev 4)
✅ 10 final frontend pages (4+2+2+2)
✅ **Total: 47 Frontend pages complete (41 existing + 10 new = All 51 pages done!)**

**Tổng kết sau Week 4:**

- Developer 1: 27 endpoints + 10 pages (22+5 APIs, 4+2+4 pages) + Tests
- Developer 2: 48 endpoints + 9 pages (29+14+5 APIs, 4+3+2 pages)
- Developer 3: 31 endpoints + 9 pages (21+5+5 APIs, 4+3+2 pages)
- Developer 4: 34 endpoints + 9 pages (23+6+5 APIs, 4+3+2 pages)
- **TOTAL: 140 APIs + 51 Frontend Pages**

---

# **WEEK 5: Polish, Integration Testing & Deployment** (Nov 27 - Dec 3, 2025)

## **Monday-Tuesday: Integration Testing (All Developers)**

### **Developer 1: Frontend-Backend Integration**

- Test all auth flows (login, register, password reset)
- Test profile updates and user management
- Test notification real-time delivery (SignalR)
- Fix any API integration issues

### **Developer 2: Event Management Testing**

- Test event creation, editing, publishing workflow
- Test organizer dashboard and analytics
- Test event approval process
- Test category and organizer management

### **Developer 3: Booking Flow Testing**

- Test full booking flow (cart → checkout → payment → tickets)
- Test seat selection and availability locks
- Test concurrent booking scenarios (race conditions)
- Test ticket transfer functionality
- Test wishlist and waitlist features

### **Developer 4: Payment & Admin Testing**

- Test Stripe payment integration end-to-end
- Test payment webhooks and confirmation emails
- Test refund request and approval workflow
- Test admin dashboard and all admin management pages
- Test review submission and display

---

## **Wednesday: Performance & Security (All Developers)**

### **Backend Optimization:**

- Add indexes to frequently queried columns
- Optimize N+1 queries với `.Include()`
- Add response caching for public endpoints
- Add rate limiting với AspNetCoreRateLimit
- Security review: SQL injection, XSS, CSRF

### **Frontend Optimization:**

- Lazy load routes with React.lazy()
- Image optimization (WebP, lazy loading)
- Code splitting and bundle size reduction
- Add loading skeletons for better UX
- Test responsive design on mobile/tablet

### **Testing:**

```bash
# Backend unit tests
dotnet test

# Frontend tests (if any)
npm run test

# Load testing
dotnet run --project LoadTests
```

---

## **Thursday: Deployment Preparation**

### **Backend Deployment (Azure App Service):**

```bash
# Publish
dotnet publish -c Release -o ./publish

# Deploy to Azure
az webapp deploy --resource-group tickify-rg \
  --name tickify-api \
  --src-path ./publish.zip
```

### **Frontend Deployment (Vercel/Netlify):**

```bash
# Build
npm run build

# Deploy
vercel deploy --prod
# or
netlify deploy --prod
```

### **Database Migration:**

```bash
# Generate migration
dotnet ef migrations add InitialCreate

# Update production database
dotnet ef database update --connection "Production_ConnectionString"
```

### **Configuration:**

- Set up environment variables in Azure
- Configure CORS for frontend domain
- Set up SSL certificates
- Configure email SMTP settings
- Set up Stripe production keys
- Configure Hangfire dashboard authentication

---

## **Friday: Final Polish & Documentation**

### **Code Quality:**

- Code review by all team members
- Fix all linting warnings
- Update comments and documentation
- Remove console.logs and debug code

### **Documentation:**

- Update README.md with setup instructions
- API documentation (Swagger)
- Frontend component documentation
- Deployment guide
- User manual (optional)

### **Final Checks:**

- ✅ All 140 APIs working
- ✅ All 51 frontend pages functional
- ✅ Payment integration tested
- ✅ Email delivery working
- ✅ Background jobs running
- ✅ Real-time notifications working
- ✅ Responsive design verified
- ✅ Security review complete
- ✅ Performance optimized
- ✅ Deployed to production

---

- Stats: Total bookings, upcoming events, wishlist count
- Recent bookings (5 items)
- Quick links: My Tickets, Order History, Wishlist

2. **OrderHistory.tsx** - Lịch sử đặt vé

   - List bookings (pagination)
   - Filters: status, date range
   - API: `GET /bookings/my-bookings`

3. **OrderDetail.tsx** - Chi tiết đơn hàng

   - Booking info: event, tickets, payment
   - Timeline: Booked → Paid → Confirmed
   - Actions: Cancel, Download tickets
   - API: `GET /bookings/{id}`

4. **TicketDetail.tsx** - Chi tiết vé

   - QR code (large display)
   - Ticket info: event, seat, date
   - Transfer ticket button
   - API: `GET /tickets/{id}`

5. **DownloadTicket.tsx** - Tải vé PDF
   - Generate PDF từ ticket data
   - Download or Email ticket

**Implementation:**

```tsx
// services/index.ts
export const bookingService = {
  getMyBookings: async () => {
    const response = await apiClient.get("/bookings/my-bookings");
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },
};
```

---

## **Tuesday: Wishlist & Review (Developer 3 & 4)**

### **Developer 3 - Wishlist & Seat Selection (3 pages):**

1. **Wishlist.tsx** - Danh sách yêu thích

   - Grid of EventCards
   - Remove button
   - API: `GET /wishlist`

2. **SeatSelection.tsx** - Chọn chỗ ngồi

   - Seat map visualization
   - Click to select/deselect
   - Show available/booked/selected
   - Integrate với Checkout
   - API: `GET /seats/ticket-type/{ticketTypeId}`

3. **Waitlist.tsx** - Danh sách chờ
   - List events trong waitlist
   - Leave waitlist button
   - API: `GET /waitlist/my-waitlists`

**Implementation:**

```tsx
// components/SeatMap.tsx
export const SeatMap = ({ ticketTypeId, onSelect }) => {
  const { seats, loading } = useSeats(ticketTypeId);
  const [selected, setSelected] = useState([]);

  const handleSeatClick = (seat) => {
    if (seat.isAvailable) {
      setSelected([...selected, seat.id]);
      onSelect(selected);
    }
  };

  return (
    <div className="seat-grid">
      {seats.map((seat) => (
        <SeatButton seat={seat} onClick={handleSeatClick} />
      ))}
    </div>
  );
};
```

---

### **Developer 4 - Review & Refund (4 pages):**

1. **WriteReview.tsx** - Viết đánh giá

   - Rating stars (1-5)
   - Comment textarea
   - Upload images (optional)
   - Submit → API `/reviews`

2. **Reviews.tsx** - Xem reviews

   - List reviews for event
   - Sort by: latest, highest rated
   - API: `GET /reviews/event/{eventId}`

3. **RefundRequest.tsx** - Yêu cầu hoàn tiền

   - Select booking to refund
   - Reason textarea
   - Submit → API `/refunds/request`

4. **RefundHistory.tsx** - Lịch sử hoàn tiền
   - List refund requests
   - Status: Pending, Approved, Rejected
   - API: `GET /refunds/my-refunds`

---

## **Wednesday: Organizer Pages (All Developers)**

### **Developer 1 - Organizer Management (3 pages):**

1. **OrganizerProfile.tsx** - Hồ sơ organizer

   - Display organizer info
   - Edit profile
   - Verification status
   - API: `GET /organizers/{id}`

2. **CreateEvent.tsx** - Tạo sự kiện

   - Multi-step form:
     - Step 1: Basic info (name, description, category)
     - Step 2: Date, venue, location
     - Step 3: Ticket types & pricing
     - Step 4: Banner upload
   - Submit → API `/events`

3. **EditEvent.tsx** - Sửa sự kiện
   - Same form as CreateEvent
   - Pre-fill with event data
   - Update → API `/events/{id}`

---

### **Developer 2 - Organizer Analytics (3 pages):**

1. **EventAnalytics.tsx** - Thống kê sự kiện

   - Revenue chart (by date)
   - Tickets sold vs remaining
   - Top selling ticket types
   - API: `GET /events/{id}/stats`

2. **OrganizerPayouts.tsx** - Thanh toán

   - List payouts
   - Request payout button
   - Earnings summary
   - API: `GET /payouts`, `POST /payouts/request`

3. **ScanTicket.tsx** - Quét vé
   - QR scanner (use device camera)
   - Validate ticket → API `/scan/validate`
   - Check-in → API `/scan/check-in`
   - Show scan history

**Implementation:**

```tsx
// hooks/useQRScanner.ts
import { Html5QrcodeScanner } from "html5-qrcode";

export const useQRScanner = (onScan) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(
      (decodedText) => onScan(decodedText),
      (error) => console.error(error)
    );

    return () => scanner.clear();
  }, []);
};
```

---

### **Developer 3 & 4 - Support & Notifications (6 pages):**

1. **SupportCenter.tsx** - Trung tâm hỗ trợ

   - List support tickets
   - Create new ticket button
   - Filter by status

2. **CreateSupportTicket.tsx** - Tạo ticket

   - Subject, description
   - Category dropdown
   - Submit → API `/support/tickets`

3. **SupportTicketDetail.tsx** - Chi tiết ticket

   - Ticket info
   - Message thread
   - Add reply form
   - API: `GET /support/tickets/{id}`

4. **Notifications.tsx** - Thông báo

   - List notifications
   - Mark as read button
   - Mark all as read
   - Real-time updates (SignalR)
   - API: `GET /notifications`

5. **NotificationSettings.tsx** - Cài đặt thông báo

   - Toggle email notifications
   - Toggle push notifications
   - Preferences: booking, events, promotions

6. **PaymentMethods.tsx** - Phương thức thanh toán
   - List saved cards (Stripe)
   - Add new card
   - Set default payment

---

## **Thursday: Admin Pages (Developer 1 & 2)**

### **Developer 1 - Admin Core (4 pages):**

1. **AdminDashboard.tsx** - Dashboard admin

   - Key metrics: Users, Events, Revenue
   - Charts: Daily bookings, Revenue trend
   - Pending approvals count
   - API: `GET /admin/dashboard/stats`

2. **ManageUsers.tsx** - Quản lý users

   - List users (pagination, search)
   - Activate/deactivate user
   - Assign roles
   - API: `GET /users`, `PUT /users/{id}/toggle-active`

3. **ManageEvents.tsx** - Quản lý events

   - List events (filter by status)
   - Approve/reject events
   - Edit/delete events
   - API: `GET /events`, `POST /events/{id}/approve`

4. **ManageCategories.tsx** - Quản lý categories
   - List categories
   - Create/edit/delete category
   - API: `GET /categories`, `POST /categories`

---

### **Developer 2 - Admin Advanced (3 pages):**

1. **ManagePayouts.tsx** - Quản lý thanh toán

   - List payout requests
   - Approve/reject payouts
   - Payout history
   - API: `GET /payouts`, `POST /payouts/{id}/approve`

2. **Reports.tsx** - Báo cáo

   - Revenue reports (daily, monthly)
   - Event performance reports
   - User growth reports
   - Export to CSV

3. **ManageRefunds.tsx** - Quản lý hoàn tiền
   - List refund requests
   - Approve/reject refunds
   - API: `GET /refunds`, `POST /refunds/{id}/approve`

---

## **Friday: Static Pages & Polish (All Developers)**

### **Static Pages (6 pages):**

1. **About.tsx** - Giới thiệu
2. **Contact.tsx** - Liên hệ (form + info)
3. **Terms.tsx** - Điều khoản sử dụng
4. **Privacy.tsx** - Chính sách bảo mật
5. **FAQ.tsx** - Câu hỏi thường gặp (Accordion)
6. **NotFound.tsx** - 404 page

### **Polish & Integration:**

- Add loading states to all pages
- Add error boundaries
- Responsive design check
- Accessibility (a11y) check
- Performance optimization (lazy loading)
- Add breadcrumbs
- Add meta tags for SEO

**Week 5 Deliverables:**
✅ Integration testing complete (all developers)
✅ Performance optimization done
✅ Security review passed
✅ Frontend-Backend fully integrated
✅ Deployed to production
✅ Documentation complete
✅ **PROJECT COMPLETE!**

---

# **Dec 4, 2025: FINAL TESTING & DEMO DAY** 📅

## **Morning (9:00 - 12:00): Unit Testing**

### **Developer 1: Auth & User Tests**

```bash
dotnet test Tests/Services/AuthServiceTests.cs
dotnet test Tests/Services/UserServiceTests.cs
dotnet test Tests/Validators/RegisterDtoValidatorTests.cs
```

**Target:** 20+ unit tests

### **Developer 2: Event & Category Tests**

```bash
dotnet test Tests/Services/EventServiceTests.cs
dotnet test Tests/Services/CategoryServiceTests.cs
dotnet test Tests/Validators/CreateEventValidatorTests.cs
```

**Target:** 20+ unit tests

### **Developer 3: Booking & Ticket Tests**

```bash
dotnet test Tests/Services/BookingServiceTests.cs
dotnet test Tests/Services/TicketServiceTests.cs
dotnet test Tests/Services/SeatServiceTests.cs
```

**Target:** 25+ unit tests

### **Developer 4: Payment & Advanced Tests**

```bash
dotnet test Tests/Services/PaymentServiceTests.cs
dotnet test Tests/Services/ReviewServiceTests.cs
dotnet test Tests/Services/NotificationServiceTests.cs
```

**Target:** 20+ unit tests

---

## **Afternoon (13:00 - 17:00): Integration Testing**

### **All Developers:**

- Integration tests for all controllers
- Test authentication flow
- Test booking with concurrent requests
- Test payment webhooks
- Test background jobs
- Load testing với JMeter/k6

**Target Code Coverage:** 70%+

---

## **End of Day: Test Report**

- Generate test coverage report
- Document test results
- Fix any failing tests
- Update README with test instructions

---

# **📊 Final Statistics**

## **Backend: 140+ API Endpoints**

**Week 1-2 Core APIs (95 endpoints):**

- Authentication: 7
- Users: 8
- Events: 14
- Categories: 4
- Organizers: 7
- Bookings: 6
- Tickets: 8
- Seats: 5
- PromoCodes: 5
- TicketScans: 3
- Payments: 5
- Reviews: 6
- Notifications: 4
- Support: 8
- Refunds: 6

**Week 3 Advanced APIs (30 endpoints):**

- Admin Dashboard: 5
- Support Advanced: 4
- Waitlist: 5
- Wishlist: 5
- Event Statistics: 5
- Payouts: 6

**Week 4 Reports & Jobs (15 endpoints):**

- Admin Dashboard APIs: 5
- Event Statistics: 5
- Booking Reports: 5
- Background Jobs: 4 (Hangfire)

## **Backend Components:**

- DTOs: 76+
- Validators: 32+
- Services: 25+
- Controllers: 24+
- Background Jobs: 4 (Hangfire)
- Tests: 100+
- Code Coverage: 70%+

## **Frontend: 51 Pages (Distributed Across 5 Weeks)**

### **✅ Existing Pages (12):**

1. Home.tsx
2. Login.tsx
3. Register.tsx
4. ForgotPassword.tsx
5. EventListing.tsx
6. EventDetail.tsx
7. Cart.tsx
8. Checkout.tsx
9. Success.tsx
10. MyTickets.tsx
11. OrganizerWizard.tsx
12. OrganizerDashboard.tsx

### **🆕 Week 1 New Pages (2):**

13. ResetPassword.tsx
14. VerifyEmail.tsx
15. About.tsx
16. Contact.tsx

### **🆕 Week 2 New Pages (16):**

**Auth & Profile (4):** 17. Profile.tsx 18. ChangePassword.tsx 19. UserDashboard.tsx 20. OrderHistory.tsx

**Organizer (4):** 21. OrganizerProfile.tsx 22. CreateEvent.tsx

**Booking & Orders (4):** 23. SeatSelection.tsx 24. OrderDetail.tsx 25. TicketDetail.tsx 26. Wishlist.tsx

**Review & Refund (4):** 27. WriteReview.tsx 28. Reviews.tsx 29. RefundRequest.tsx 30. RefundHistory.tsx

### **🆕 Week 3 New Pages (11):**

**Notifications (2):** 31. Notifications.tsx 32. NotificationSettings.tsx

**Event Management (3):** 33. EditEvent.tsx 34. EventAnalytics.tsx 35. ScanTicket.tsx

**Support (3):** 36. SupportCenter.tsx 37. CreateSupportTicket.tsx 38. SupportTicketDetail.tsx

**Admin (3):** 39. OrganizerPayouts.tsx 40. AdminDashboard.tsx 41. ManageUsers.tsx

### **🆕 Week 4 New Pages (10):**

**Static Pages (4):** 42. Terms.tsx 43. Privacy.tsx 44. FAQ.tsx 45. NotFound.tsx

**Admin Pages (6):** 46. ManageEvents.tsx 47. ManageCategories.tsx 48. ManagePayouts.tsx 49. Reports.tsx 50. ManageRefunds.tsx 51. Waitlist.tsx

## **Frontend Components:**

- Pages: 51 (12 existing + 39 new, distributed across 5 weeks)
- Custom Hooks: 8 (useAuth, useCart, useEvents, useEvent, useFeaturedEvents, useLocalStorage)
- Stores: 2 (Auth, Cart - Zustand with persistence)
- Services: 4 (API client, Auth, Event, Booking)
- Utils: 10+ helper functions (formatCurrency, formatDate, validation, etc.)
- UI Components: 40+ (shadcn/ui + Radix UI)

## **Work Distribution Summary:**

**Developer 1 (Full Stack):**

- Backend: 27 endpoints (Auth, User, Notification, Scan)
- Frontend: 10 pages (Auth + Profile + Notifications + Static)
- Total: 27 APIs + 10 pages

**Developer 2 (Full Stack):**

- Backend: 48 endpoints (Event, Category, Organizer, Support, Dashboard)
- Frontend: 9 pages (Event + Organizer + Admin)
- Total: 48 APIs + 9 pages

**Developer 3 (Full Stack):**

- Backend: 31 endpoints (Booking, Ticket, Seat, PromoCode, Statistics)
- Frontend: 10 pages (Booking flow + Orders + Support + Admin)
- Total: 31 APIs + 10 pages

**Developer 4 (Full Stack):**

- Backend: 34 endpoints (Payment, Review, Refund, Payout, Reports)
- Frontend: 10 pages (Review + Refund + Admin + Static + Tests)
- Total: 34 APIs + 10 pages

## **Total Project Size:**

- Backend: 140+ APIs, 76+ DTOs, 32+ Validators
- Frontend: 51 Pages, 40+ Components, 8 Hooks
- Infrastructure: 4 Background Jobs, SignalR Real-time, Stripe Payment
- Testing: 100+ unit tests, Integration tests, Race condition tests
- Total Features: Full-stack event booking platform
- Team Size: 4 full-stack developers
- Duration: 5 weeks (Oct 28 - Dec 3, 2025) + 1 day demo

---

# **✅ Success Criteria**

### **Functional:**

✅ User registration & authentication working
✅ Event creation & approval workflow
✅ Booking system với seat locking (NO race conditions!)
✅ Payment processing hoàn chỉnh
✅ QR code generation & scanning
✅ Email notifications
✅ Real-time notifications (SignalR)
✅ Background jobs running
✅ All 95+ endpoints tested

### **Non-Functional:**

✅ API response time < 1s (p95)
✅ Booking creation < 2s
✅ Payment processing < 5s
✅ Code coverage 70%+
✅ No critical security vulnerabilities
✅ Deployed to production
✅ Complete documentation

---

# **🎉 DONE! Chúc mừng team đã hoàn thành!**

**Tổng công sức:**

- 4 developers
- 5 weeks coding + 1 day testing
- 95+ API endpoints
- 76+ DTOs
- 32+ Validators
- 100+ Tests
- Production-ready application

**Next Steps:**

- Mobile app (Flutter/React Native)
- Admin dashboard (React/Vue)
- Analytics & reporting
- Multi-language support

---

**Good luck team! Let's build Tickify! 🚀**
