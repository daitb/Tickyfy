# PHÂN TÍCH VÀ KẾ HOẠCH HOÀN THIỆN HỆ THỐNG NOTIFICATIONS

**Ngày tạo:** 2025-01-XX  
**Người phân tích:** Tiểu Yêu  
**Mục tiêu:** Đánh giá toàn diện hệ thống Notifications và đưa ra kế hoạch hoàn thiện

---

## 1. PHÂN TÍCH HIỆN TRẠNG

### 1.1. Những loại thông báo đang có

#### ✅ Đã triển khai:
1. **BookingConfirmed** - Xác nhận đặt vé thành công
2. **PaymentSuccess** - Thanh toán thành công
3. **PaymentFailed** - Thanh toán thất bại
4. **EventApproved** - Sự kiện được duyệt (cho organizer)
5. **EventRejected** - Sự kiện bị từ chối (cho organizer)
6. **EventReminder** - Nhắc nhở sự kiện (24h trước)
7. **TicketTransfer** - Chuyển vé
8. **RefundApproved** - Hoàn tiền được duyệt
9. **RefundRejected** - Hoàn tiền bị từ chối
10. **WaitlistAvailable** - Có vé từ waitlist

### 1.2. Kiến trúc hiện tại

#### Backend:
- ✅ **NotificationService** - Service layer xử lý notifications
- ✅ **NotificationController** - REST API endpoints
- ✅ **NotificationHub** (SignalR) - Real-time push
- ✅ **Notification Model** - Database entity
- ✅ **EmailReminderJob** - Background job gửi reminder

#### Frontend:
- ✅ **NotificationDropdown** - Popover trên header
- ✅ **Notifications.tsx** - Trang danh sách notifications
- ✅ **notificationService.ts** - Client service gọi API
- ⚠️ **SignalR connection** - CHƯA kết nối NotificationHub (chỉ có ChatHub)

### 1.3. Database Schema

```sql
-- Bảng Notifications hiện tại
Notifications:
  - Id (PK)
  - UserId (FK)
  - Title
  - Message
  - Type (string)
  - IsRead
  - CreatedAt
  - ReadAt
  - RelatedUrl (nullable)
```

**Thiếu:**
- ❌ Bảng `NotificationSettings` - Cài đặt cá nhân hóa
- ❌ Bảng `NotificationDeliveryLog` - Log gửi thông báo
- ❌ Bảng `UserDevices` - Quản lý push notification tokens
- ❌ Trường `Priority` - Độ ưu tiên
- ❌ Trường `ActionData` (JSON) - Dữ liệu động cho actions
- ❌ Trường `ExpiresAt` - Thời gian hết hạn
- ❌ Trường `Channel` - Kênh gửi (in-app, email, SMS, push)

### 1.4. API Endpoints hiện có

✅ **GET** `/api/notifications` - Lấy danh sách  
✅ **PUT** `/api/notifications/{id}/read` - Đánh dấu đã đọc  
✅ **PUT** `/api/notifications/read-all` - Đánh dấu tất cả đã đọc  
✅ **DELETE** `/api/notifications/{id}` - Xóa  

**Thiếu:**
- ❌ **GET** `/api/notifications/unread-count` - Số lượng chưa đọc
- ❌ **GET** `/api/notifications?type=xxx&page=1&limit=20` - Pagination & Filtering
- ❌ **PUT** `/api/notifications/{id}/unread` - Đánh dấu chưa đọc
- ❌ **POST** `/api/notifications/test` - Test notification
- ❌ **GET** `/api/notifications/settings` - Lấy cài đặt
- ❌ **PUT** `/api/notifications/settings` - Cập nhật cài đặt

### 1.5. Real-time (SignalR)

**Hiện trạng:**
- ✅ Backend có `NotificationHub`
- ✅ Service gửi qua SignalR trong `CreateNotificationAsync`
- ❌ **Frontend CHƯA kết nối** - Không có service kết nối NotificationHub
- ❌ Không có auto-refresh khi có notification mới

### 1.6. UI/UX hiện tại

**NotificationDropdown:**
- ✅ Hiển thị badge số lượng chưa đọc
- ✅ List notifications trong popover
- ✅ Mark as read, delete
- ✅ Navigate khi click
- ⚠️ Hard-coded limit 50 notifications
- ⚠️ Không có pagination
- ⚠️ Không có filter trong dropdown

**Notifications Page:**
- ✅ Tabs filter (All, Unread, Ticket, Event, Promo, Payment, System)
- ✅ Group by date
- ✅ Mark all as read
- ✅ Settings dialog (nhưng chưa kết nối backend)
- ⚠️ "Load More" button chưa hoạt động
- ⚠️ Settings chỉ là UI, chưa lưu vào database

### 1.7. Cơ chế gửi thông báo

**Hiện tại:**
- ✅ In-app notification (lưu DB + SignalR)
- ✅ Email reminder (EmailReminderJob)
- ❌ **Không có email cho các notification khác** (chỉ có reminder)
- ❌ Không có SMS
- ❌ Không có Push notification (mobile)
- ❌ Không có batching/compression
- ❌ Không có retry mechanism

### 1.8. Business Rules & Logic

**Đã có:**
- ✅ Gửi notification khi payment success
- ✅ Gửi notification khi booking confirmed
- ✅ Gửi reminder 24h trước event
- ✅ Gửi notification khi event approved/rejected

**Thiếu:**
- ❌ **Event cancelled** - Chưa có notification
- ❌ **Event updated** (date, venue, price) - Chưa có
- ❌ **Low inventory alert** (cho organizer) - Chưa có
- ❌ **New ticket sale** (cho organizer) - Chưa có
- ❌ **Review received** (cho organizer) - Chưa có
- ❌ **Payout processed** (cho organizer) - Chưa có
- ❌ **Security alerts** (login từ device mới, password changed) - Chưa có
- ❌ **Promo code applied** - Chưa có
- ❌ **Ticket scan success/failed** - Chưa có
- ❌ **Booking expired** - Chưa có
- ❌ **Waitlist expired** - Chưa có
- ❌ **Multiple reminders** (24h, 1h, 30min) - Chỉ có 24h
- ❌ **Rate limiting** - Tránh spam notifications
- ❌ **Deduplication** - Tránh duplicate notifications

---

## 2. DANH SÁCH THIẾU SÓT CHI TIẾT

### 2.1. Database Schema

#### ❌ Thiếu bảng `NotificationSettings`
```sql
NotificationSettings:
  - Id (PK)
  - UserId (FK, Unique)
  - EmailEnabled (bool, default: true)
  - PushEnabled (bool, default: false)
  - SmsEnabled (bool, default: false)
  - InAppEnabled (bool, default: true)
  - EmailSettings (JSON) - Chi tiết từng loại email
  - PushSettings (JSON) - Chi tiết từng loại push
  - SmsSettings (JSON) - Chi tiết từng loại SMS
  - QuietHoursStart (Time) - Giờ bắt đầu không làm phiền
  - QuietHoursEnd (Time) - Giờ kết thúc không làm phiền
  - DoNotDisturb (bool, default: false)
  - UpdatedAt
```

#### ❌ Thiếu bảng `NotificationDeliveryLog`
```sql
NotificationDeliveryLog:
  - Id (PK)
  - NotificationId (FK)
  - Channel (enum: InApp, Email, SMS, Push)
  - Status (enum: Pending, Sent, Failed, Retrying)
  - AttemptCount (int)
  - ErrorMessage (text, nullable)
  - SentAt (datetime, nullable)
  - RetryAt (datetime, nullable)
  - CreatedAt
```

#### ❌ Thiếu bảng `UserDevices`
```sql
UserDevices:
  - Id (PK)
  - UserId (FK)
  - DeviceToken (string, unique)
  - DeviceType (enum: Web, iOS, Android)
  - DeviceName (string)
  - PushEnabled (bool)
  - LastActiveAt
  - CreatedAt
```

#### ❌ Thiếu trường trong bảng `Notifications`
- `Priority` (enum: Low, Normal, High, Urgent)
- `ActionData` (JSON) - Dữ liệu động cho buttons/actions
- `ExpiresAt` (datetime, nullable)
- `Channel` (enum) - Kênh gửi chính
- `Metadata` (JSON) - Thông tin bổ sung

### 2.2. API Endpoints

#### ❌ Thiếu endpoints cơ bản:
1. `GET /api/notifications/unread-count` - Lấy số lượng chưa đọc
2. `GET /api/notifications?type=xxx&page=1&limit=20` - Pagination & Filtering
3. `PUT /api/notifications/{id}/unread` - Đánh dấu chưa đọc
4. `DELETE /api/notifications/read` - Xóa tất cả đã đọc
5. `POST /api/notifications/test` - Test notification

#### ❌ Thiếu endpoints Settings:
6. `GET /api/notifications/settings` - Lấy cài đặt
7. `PUT /api/notifications/settings` - Cập nhật cài đặt

#### ❌ Thiếu endpoints Admin:
8. `GET /api/admin/notifications/stats` - Thống kê
9. `POST /api/admin/notifications/broadcast` - Gửi broadcast

### 2.3. Frontend SignalR Connection

#### ❌ Chưa có:
- Service kết nối `NotificationHub` (chỉ có ChatHub)
- Auto-refresh khi nhận notification mới
- Real-time update badge count
- Sound/visual notification khi có notification mới

### 2.4. Loại thông báo còn thiếu

#### Cho người mua vé:
- ❌ Event cancelled
- ❌ Event updated (date, venue, price change)
- ❌ Booking expired (khi chưa thanh toán)
- ❌ Waitlist expired
- ❌ Promo code applied
- ❌ Ticket scan success (khi check-in)
- ❌ Security alerts (login mới, password changed)
- ❌ Review reminder (sau event)
- ❌ Multiple event reminders (1h, 30min trước)

#### Cho organizer:
- ❌ New ticket sale
- ❌ Low inventory alert (< 10% còn lại)
- ❌ High demand alert (bán nhanh)
- ❌ Review received
- ❌ Payout processed
- ❌ Payout failed
- ❌ Event analytics digest (weekly/monthly)
- ❌ Refund request received

#### Cho admin:
- ❌ Organizer request pending
- ❌ High-risk booking detected
- ❌ System alerts

### 2.5. Multi-channel Delivery

#### ❌ Chưa có:
- Email service integration (chỉ có reminder email)
- SMS service integration
- Push notification service (FCM/APNS)
- Channel selection logic (gửi qua kênh nào)
- Fallback mechanism (nếu in-app fail thì gửi email)

### 2.6. Business Logic & Rules

#### ❌ Thiếu:
- Rate limiting (max 10 notifications/giờ cho user)
- Deduplication (tránh duplicate trong 5 phút)
- Batching (gộp nhiều notifications cùng loại)
- Priority queue (urgent notifications được gửi trước)
- Expiration (xóa notifications cũ > 90 ngày)
- Quiet hours (không gửi trong giờ nghỉ)
- User preferences (tôn trọng settings của user)

### 2.7. Error Handling & Retry

#### ❌ Thiếu:
- Retry mechanism khi gửi fail
- Dead letter queue cho notifications fail nhiều lần
- Error logging chi tiết
- Monitoring & alerting

### 2.8. UI/UX Improvements

#### ❌ Thiếu:
- Pagination thực sự (infinite scroll hoặc load more)
- Search notifications
- Filter by date range
- Group by type trong dropdown
- Empty states tốt hơn
- Loading skeletons
- Animation khi có notification mới
- Sound notification (optional)
- Desktop notification (browser notification API)

### 2.9. Testing & Quality

#### ❌ Thiếu:
- Unit tests cho NotificationService
- Integration tests cho API
- E2E tests cho notification flow
- Load testing cho SignalR
- Test coverage metrics

---

## 3. GIẢI PHÁP HOÀN THIỆN

### 3.1. Mô hình Notifications tối ưu

#### A. Loại thông báo đầy đủ

**Người mua vé:**
1. BookingConfirmed
2. PaymentSuccess
3. PaymentFailed
4. EventReminder (24h, 1h, 30min)
5. EventCancelled
6. EventUpdated
7. TicketTransfer (received)
8. TicketTransfer (sent)
9. RefundApproved
10. RefundRejected
11. WaitlistAvailable
12. WaitlistExpired
13. BookingExpired
14. PromoCodeApplied
15. TicketScanSuccess
16. ReviewReminder
17. SecurityAlert (login mới, password changed)

**Ban tổ chức:**
1. EventApproved
2. EventRejected
3. NewTicketSale
4. LowInventoryAlert
5. HighDemandAlert
6. ReviewReceived
7. PayoutProcessed
8. PayoutFailed
9. AnalyticsDigest (weekly/monthly)
10. RefundRequestReceived

**Hệ thống:**
1. SystemMaintenance
2. SystemUpdate
3. PolicyUpdate

**Cảnh báo bảo mật:**
1. LoginFromNewDevice
2. PasswordChanged
3. SuspiciousActivity

#### B. Kiến trúc hệ thống

```
┌─────────────────┐
│ Event Producers │  (Booking, Payment, Event, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Notification    │  (Create, validate, enrich)
│ Service         │
└────────┬────────┘
         │
         ├──► NotificationSettings (check preferences)
         │
         ▼
┌─────────────────┐
│ Notification    │  (Queue, prioritize, batch)
│ Queue           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Delivery        │  (In-App, Email, SMS, Push)
│ Channel Manager │
└────────┬────────┘
         │
         ├──► SignalR Hub (In-App)
         ├──► Email Service
         ├──► SMS Service
         └──► Push Service (FCM/APNS)
```

#### C. Database Schema đầy đủ

**Bảng `Notifications` (mở rộng):**
```sql
CREATE TABLE Notifications (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(1000) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Priority TINYINT NOT NULL DEFAULT 1, -- 0=Low, 1=Normal, 2=High, 3=Urgent
    IsRead BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ReadAt DATETIME2 NULL,
    ExpiresAt DATETIME2 NULL,
    RelatedUrl NVARCHAR(500) NULL,
    ActionData NVARCHAR(MAX) NULL, -- JSON
    Metadata NVARCHAR(MAX) NULL, -- JSON
    Channel TINYINT NOT NULL DEFAULT 0, -- 0=InApp, 1=Email, 2=SMS, 3=Push
    
    CONSTRAINT FK_Notifications_User FOREIGN KEY (UserId) REFERENCES Users(Id),
    INDEX IX_Notifications_UserId_IsRead (UserId, IsRead),
    INDEX IX_Notifications_CreatedAt (CreatedAt),
    INDEX IX_Notifications_ExpiresAt (ExpiresAt)
);
```

**Bảng `NotificationSettings`:**
```sql
CREATE TABLE NotificationSettings (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL UNIQUE,
    EmailEnabled BIT NOT NULL DEFAULT 1,
    PushEnabled BIT NOT NULL DEFAULT 0,
    SmsEnabled BIT NOT NULL DEFAULT 0,
    InAppEnabled BIT NOT NULL DEFAULT 1,
    EmailSettings NVARCHAR(MAX) NULL, -- JSON: { "booking": true, "event": true, ... }
    PushSettings NVARCHAR(MAX) NULL,
    SmsSettings NVARCHAR(MAX) NULL,
    QuietHoursStart TIME NULL,
    QuietHoursEnd TIME NULL,
    DoNotDisturb BIT NOT NULL DEFAULT 0,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_NotificationSettings_User FOREIGN KEY (UserId) REFERENCES Users(Id)
);
```

**Bảng `NotificationDeliveryLog`:**
```sql
CREATE TABLE NotificationDeliveryLog (
    Id BIGINT PRIMARY KEY IDENTITY,
    NotificationId INT NOT NULL,
    Channel TINYINT NOT NULL, -- 0=InApp, 1=Email, 2=SMS, 3=Push
    Status TINYINT NOT NULL DEFAULT 0, -- 0=Pending, 1=Sent, 2=Failed, 3=Retrying
    AttemptCount INT NOT NULL DEFAULT 0,
    ErrorMessage NVARCHAR(MAX) NULL,
    SentAt DATETIME2 NULL,
    RetryAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_NotificationDeliveryLog_Notification 
        FOREIGN KEY (NotificationId) REFERENCES Notifications(Id),
    INDEX IX_NotificationDeliveryLog_Status_RetryAt (Status, RetryAt)
);
```

**Bảng `UserDevices`:**
```sql
CREATE TABLE UserDevices (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    DeviceToken NVARCHAR(500) NOT NULL UNIQUE,
    DeviceType TINYINT NOT NULL, -- 0=Web, 1=iOS, 2=Android
    DeviceName NVARCHAR(200) NULL,
    PushEnabled BIT NOT NULL DEFAULT 1,
    LastActiveAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_UserDevices_User FOREIGN KEY (UserId) REFERENCES Users(Id),
    INDEX IX_UserDevices_UserId (UserId)
);
```

#### D. API Endpoints đầy đủ

**User APIs:**
```
GET    /api/notifications                    - List (với pagination & filter)
GET    /api/notifications/unread-count      - Số lượng chưa đọc
GET    /api/notifications/{id}             - Chi tiết
PUT    /api/notifications/{id}/read        - Đánh dấu đã đọc
PUT    /api/notifications/{id}/unread      - Đánh dấu chưa đọc
PUT    /api/notifications/read-all         - Đánh dấu tất cả đã đọc
DELETE /api/notifications/{id}              - Xóa
DELETE /api/notifications/read              - Xóa tất cả đã đọc
GET    /api/notifications/settings          - Lấy cài đặt
PUT    /api/notifications/settings          - Cập nhật cài đặt
POST   /api/notifications/test              - Test notification
```

**Admin APIs:**
```
GET    /api/admin/notifications/stats       - Thống kê
POST   /api/admin/notifications/broadcast   - Gửi broadcast
GET    /api/admin/notifications/delivery-log - Xem delivery log
```

#### E. Logic & Rules

**Template System:**
- Tạo `NotificationTemplate` service
- Mỗi loại notification có template với placeholders
- Support i18n (multi-language)

**Multi-channel Logic:**
```csharp
// Pseudo code
if (userSettings.InAppEnabled && notificationType.AllowInApp) {
    SendInApp();
}
if (userSettings.EmailEnabled && notificationType.AllowEmail) {
    SendEmail();
}
if (userSettings.PushEnabled && notificationType.AllowPush) {
    SendPush();
}
```

**Rate Limiting:**
- Max 10 notifications/giờ cho user
- Max 1 notification/loại trong 5 phút (deduplication)
- Urgent notifications bypass rate limit

**Batching:**
- Gộp nhiều notifications cùng loại trong 1 phút
- Ví dụ: 5 ticket sales → 1 notification "5 new ticket sales"

**Priority Queue:**
- Urgent → High → Normal → Low
- Background job xử lý queue

**Quiet Hours:**
- Không gửi notifications trong quiet hours (trừ urgent)

#### F. UI/UX Improvements

**NotificationDropdown:**
- Infinite scroll hoặc "Load More"
- Filter tabs (All, Unread, Type)
- Group by date
- Sound notification (optional)
- Desktop notification (browser API)

**Notifications Page:**
- Search bar
- Date range filter
- Export notifications
- Mark as unread
- Bulk actions

**Real-time:**
- SignalR connection tự động
- Auto-refresh khi có notification mới
- Animation khi có notification mới
- Sound notification (optional)

---

## 4. CHECKLIST THỰC THI

### Phase 1: Database & Backend Core (Tuần 1-2)

#### Database
- [ ] Tạo migration cho `NotificationSettings` table
- [ ] Tạo migration cho `NotificationDeliveryLog` table
- [ ] Tạo migration cho `UserDevices` table
- [ ] Thêm các trường mới vào `Notifications` table (Priority, ActionData, Metadata, ExpiresAt, Channel)
- [ ] Tạo indexes cho performance
- [ ] Seed default notification settings cho existing users

#### Backend Models & DTOs
- [ ] Tạo `NotificationSettings` model
- [ ] Tạo `NotificationDeliveryLog` model
- [ ] Tạo `UserDevice` model
- [ ] Cập nhật `Notification` model với các trường mới
- [ ] Tạo DTOs cho Settings (GetSettingsDto, UpdateSettingsDto)
- [ ] Tạo DTOs cho DeliveryLog (DeliveryLogDto)

#### Backend Services
- [ ] Tạo `INotificationSettingsService` interface
- [ ] Implement `NotificationSettingsService`
- [ ] Tạo `INotificationDeliveryService` interface
- [ ] Implement `NotificationDeliveryService` (multi-channel)
- [ ] Cập nhật `NotificationService` với priority, batching, rate limiting
- [ ] Tạo `NotificationTemplateService` cho template management
- [ ] Tạo `NotificationQueueService` cho queue management

#### Backend Controllers
- [ ] Thêm pagination & filtering vào `GET /api/notifications`
- [ ] Thêm `GET /api/notifications/unread-count`
- [ ] Thêm `PUT /api/notifications/{id}/unread`
- [ ] Thêm `DELETE /api/notifications/read`
- [ ] Thêm `GET /api/notifications/settings`
- [ ] Thêm `PUT /api/notifications/settings`
- [ ] Thêm `POST /api/notifications/test`
- [ ] Tạo `NotificationSettingsController`

### Phase 2: Multi-channel Delivery (Tuần 3-4)

#### Email Integration
- [ ] Tích hợp email service cho tất cả notification types
- [ ] Tạo email templates cho từng loại notification
- [ ] Implement email queue với retry mechanism
- [ ] Test email delivery

#### SMS Integration (Optional)
- [ ] Tích hợp SMS service (Twilio hoặc tương tự)
- [ ] Tạo SMS templates
- [ ] Implement SMS queue
- [ ] Test SMS delivery

#### Push Notification
- [ ] Tích hợp FCM (Firebase Cloud Messaging) cho Android
- [ ] Tích hợp APNS (Apple Push Notification Service) cho iOS
- [ ] Tạo `PushNotificationService`
- [ ] Implement device token management
- [ ] Test push delivery

#### Delivery Service
- [ ] Implement channel selection logic
- [ ] Implement fallback mechanism
- [ ] Implement retry với exponential backoff
- [ ] Implement dead letter queue
- [ ] Logging & monitoring

### Phase 3: Business Logic & New Notification Types (Tuần 5-6)

#### New Notification Types
- [ ] EventCancelled notification
- [ ] EventUpdated notification
- [ ] BookingExpired notification
- [ ] WaitlistExpired notification
- [ ] NewTicketSale (organizer)
- [ ] LowInventoryAlert (organizer)
- [ ] HighDemandAlert (organizer)
- [ ] ReviewReceived (organizer)
- [ ] PayoutProcessed (organizer)
- [ ] SecurityAlert (login mới, password changed)
- [ ] Multiple reminders (1h, 30min trước event)

#### Business Rules
- [ ] Implement rate limiting
- [ ] Implement deduplication
- [ ] Implement batching
- [ ] Implement priority queue
- [ ] Implement quiet hours
- [ ] Implement expiration (auto-delete old notifications)

#### Background Jobs
- [ ] Cập nhật `EmailReminderJob` với multiple reminders
- [ ] Tạo `NotificationDeliveryJob` để xử lý queue
- [ ] Tạo `NotificationCleanupJob` để xóa notifications cũ
- [ ] Tạo `NotificationRetryJob` để retry failed deliveries

### Phase 4: Frontend Integration (Tuần 7-8)

#### SignalR Connection
- [ ] Tạo `notificationSignalRService.ts` để kết nối NotificationHub
- [ ] Implement auto-connect khi user login
- [ ] Implement auto-reconnect khi mất kết nối
- [ ] Handle `ReceiveNotification` event
- [ ] Update badge count real-time
- [ ] Show toast/desktop notification khi có notification mới

#### NotificationDropdown Improvements
- [ ] Thêm pagination (infinite scroll hoặc load more)
- [ ] Thêm filter tabs
- [ ] Thêm group by date
- [ ] Thêm sound notification (optional, với user setting)
- [ ] Thêm desktop notification (browser API)
- [ ] Animation khi có notification mới

#### Notifications Page Improvements
- [ ] Implement pagination thực sự
- [ ] Thêm search bar
- [ ] Thêm date range filter
- [ ] Thêm export functionality
- [ ] Thêm mark as unread
- [ ] Thêm bulk actions
- [ ] Improve empty states
- [ ] Add loading skeletons

#### Settings Integration
- [ ] Kết nối Settings UI với backend API
- [ ] Implement save/load settings
- [ ] Add validation
- [ ] Show success/error messages

### Phase 5: Testing & Quality (Tuần 9-10)

#### Unit Tests
- [ ] Test `NotificationService`
- [ ] Test `NotificationSettingsService`
- [ ] Test `NotificationDeliveryService`
- [ ] Test business rules (rate limiting, deduplication, batching)
- [ ] Test notification templates

#### Integration Tests
- [ ] Test API endpoints
- [ ] Test SignalR hub
- [ ] Test email delivery
- [ ] Test push delivery
- [ ] Test multi-channel delivery

#### E2E Tests
- [ ] Test notification flow từ trigger đến hiển thị
- [ ] Test settings update flow
- [ ] Test real-time notification
- [ ] Test pagination & filtering

#### Performance Testing
- [ ] Load test SignalR hub
- [ ] Load test notification API
- [ ] Test với 10k+ notifications
- [ ] Optimize database queries

#### Documentation
- [ ] API documentation
- [ ] Architecture documentation
- [ ] User guide
- [ ] Developer guide

### Phase 6: Monitoring & Analytics (Tuần 11-12)

#### Monitoring
- [ ] Setup logging cho notification delivery
- [ ] Setup alerting cho failed deliveries
- [ ] Dashboard cho notification stats
- [ ] Track delivery rates per channel

#### Analytics
- [ ] Track notification open rates
- [ ] Track notification click-through rates
- [ ] Track channel effectiveness (in-app vs email vs push)
- [ ] User engagement metrics

---

## 5. ƯU TIÊN THỰC THI

### High Priority (Làm ngay)
1. ✅ Fix SignalR connection trên frontend
2. ✅ Thêm pagination & filtering vào API
3. ✅ Thêm NotificationSettings table & API
4. ✅ Thêm các notification types còn thiếu (EventCancelled, EventUpdated, etc.)
5. ✅ Implement rate limiting & deduplication

### Medium Priority (Làm sau)
1. Multi-channel delivery (Email, SMS, Push)
2. Batching & priority queue
3. UI/UX improvements (search, filters, etc.)
4. Background jobs cho delivery

### Low Priority (Nice to have)
1. Analytics & monitoring
2. Export functionality
3. Desktop notifications
4. Sound notifications

---

## 6. KẾT LUẬN

Hệ thống Notifications hiện tại đã có nền tảng tốt với:
- ✅ Core service layer
- ✅ REST API cơ bản
- ✅ SignalR hub (backend)
- ✅ UI components

Tuy nhiên, còn nhiều thiếu sót cần hoàn thiện:
- ❌ Multi-channel delivery
- ❌ User preferences/settings
- ❌ Business rules (rate limiting, batching, etc.)
- ❌ Nhiều loại notification còn thiếu
- ❌ Frontend SignalR connection
- ❌ Pagination & filtering
- ❌ Error handling & retry

Với checklist trên, team có thể hoàn thiện hệ thống trong **12 tuần** với 2 developers.

---

**Tài liệu này sẽ được cập nhật khi có thay đổi.**

