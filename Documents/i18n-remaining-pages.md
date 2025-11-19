# 🌐 Hướng dẫn cập nhật tất cả các trang với i18n

## 📊 Tổng quan
- **Hoàn thành**: 7/39 trang (18%)
- **Còn lại**: 32 trang cần cập nhật
- **Translation keys**: 300+ keys đã sẵn sàng

## ✅ Các trang đã hoàn thành 100%
1. ✅ Login.tsx
2. ✅ Register.tsx
3. ✅ BecomeOrganizer.tsx
4. ✅ ForgotPassword.tsx
5. ✅ Header.tsx (component)
6. ✅ LanguageSwitcher.tsx (component)

## ⏳ Các trang đã thêm hook (cần thay text)
7. ⏳ Home.tsx
8. ⏳ EventListing.tsx
9. ⏳ MyTickets.tsx
10. ⏳ UserManagement.tsx

---

## 🚀 PHƯƠNG PHÁP 1: Tự động (Nhanh nhất)

### Bước 1: Chạy script tự động thêm hooks
```powershell
cd Source/tickify.client
node add-i18n-to-pages.js
```

Script này sẽ tự động thêm:
- Import statement: `import { useTranslation } from 'react-i18next';`
- Hook declaration: `const { t } = useTranslation();`

### Bước 2: Thay thế text thủ công
Mở từng file và thay thế text theo pattern:

**Trước:**
```tsx
<h1>Welcome to Tickify</h1>
<button>Buy Tickets</button>
```

**Sau:**
```tsx
<h1>{t('home.welcome')}</h1>
<button>{t('common.buyTickets')}</button>
```

---

## 🛠️ PHƯƠNG PHÁP 2: Thủ công từng file

### Template chuẩn cho mỗi page:

#### 1. Thêm import (đầu file)
```tsx
import { useTranslation } from 'react-i18next';
```

#### 2. Thêm hook (trong component)
```tsx
export function PageName() {
  const { t } = useTranslation();
  
  // ... rest of code
}
```

#### 3. Thay thế text
```tsx
// Headings
<h1>{t('section.title')}</h1>

// Buttons
<button>{t('common.save')}</button>

// Labels
<label>{t('form.email')}</label>

// Placeholders
<input placeholder={t('form.enterEmail')} />

// Messages
{error && <p>{t('errors.generic')}</p>}
```

---

## 📋 CHECKLIST - Các trang cần cập nhật

### Auth Pages (6)
- [ ] **ResetPassword.tsx**
  - Keys cần: `auth.resetPassword.title`, `.newPassword`, `.confirmPassword`, `.submit`
  
- [ ] **EmailVerification.tsx**
  - Keys cần: `auth.verification.title`, `.verifying`, `.success`, `.failed`
  
- [ ] **UserProfile.tsx**
  - Keys cần: `profile.title`, `.editProfile`, `.personalInfo`, `.save`
  
- [ ] **PasswordChange.tsx**
  - Keys cần: `profile.changePassword`, `.currentPassword`, `.newPassword`

### Event Pages (7)
- [ ] **EventDetail.tsx / EventDetailPage.tsx**
  - Keys cần: `events.details`, `.date`, `.time`, `.location`, `.bookNow`
  - Keys cần: `events.description`, `.reviews`, `.organizer`
  
- [ ] **Home.tsx** ⏳
  - Keys cần: `home.hero`, `.categories`, `.upcomingEvents`, `.viewAll`
  - **ĐÃ CÓ HOOK** - chỉ cần thay text
  
- [ ] **EventListing.tsx** ⏳
  - Keys cần: `events.filters`, `.search`, `.category`, `.date`, `.price`
  - **ĐÃ CÓ HOOK** - chỉ cần thay text

### Booking Pages (9)
- [ ] **Cart.tsx**
  - Keys cần: `booking.cart.title`, `.items`, `.total`, `.checkout`
  
- [ ] **Checkout.tsx**
  - Keys cần: `booking.checkout.title`, `.billingInfo`, `.paymentMethod`
  
- [ ] **SeatSelection.tsx**
  - Keys cần: `booking.seatSelection.title`, `.available`, `.selected`
  
- [ ] **MyTickets.tsx** ⏳
  - Keys cần: `booking.myTickets.title`, `.upcoming`, `.past`, `.cancelled`
  - **ĐÃ CÓ HOOK** - chỉ cần thay text
  
- [ ] **OrderDetail.tsx**
  - Keys cần: `booking.orderDetail.title`, `.orderNumber`, `.status`
  
- [ ] **TicketDetail.tsx**
  - Keys cần: `booking.ticketDetail.title`, `.qrCode`, `.download`
  
- [ ] **Success.tsx**
  - Keys cần: `booking.success.title`, `.message`, `.viewTickets`
  
- [ ] **TransferTicket.tsx**
  - Keys cần: `booking.transfer.title`, `.recipientEmail`, `.confirm`
  
- [ ] **RefundRequest.tsx**
  - Keys cần: `booking.refund.title`, `.reason`, `.amount`, `.submit`

### Review Pages (2)
- [ ] **ReviewSubmission.tsx**
  - Keys cần: `review.submit.title`, `.rating`, `.comment`, `.submit`
  
- [ ] **EventReviews.tsx** (nếu riêng biệt)
  - Keys cần: `review.all`, `.filters`, `.sortBy`

### User Features (4)
- [ ] **Wishlist.tsx**
  - Keys cần: `user.wishlist.title`, `.empty`, `.removeAll`
  
- [ ] **Waitlist.tsx**
  - Keys cần: `user.waitlist.title`, `.join`, `.leave`
  
- [ ] **Notifications.tsx**
  - Keys cần: `user.notifications.title`, `.markAsRead`, `.clear`
  
- [ ] **NotificationPreferences.tsx**
  - Keys cần: `user.notificationPrefs.title`, `.emailNotif`, `.pushNotif`

### Organizer Pages (8)
- [ ] **OrganizerDashboard.tsx**
  - Keys cần: `organizer.dashboard.title`, `.stats`, `.recentEvents`
  
- [ ] **OrganizerWizard.tsx**
  - Keys cần: `organizer.wizard.step1`, `.step2`, `.step3`, `.next`, `.back`
  
- [ ] **EventManagement.tsx**
  - Keys cần: `organizer.events.title`, `.create`, `.edit`, `.delete`
  
- [ ] **EditEvent.tsx**
  - Keys cần: `organizer.editEvent.title`, `.basicInfo`, `.tickets`
  
- [ ] **EventAnalytics.tsx**
  - Keys cần: `organizer.analytics.title`, `.revenue`, `.attendees`, `.sales`
  
- [ ] **PromoCodeManagement.tsx**
  - Keys cần: `organizer.promoCodes.title`, `.create`, `.active`, `.expired`
  
- [ ] **SeatMapBuilder.tsx**
  - Keys cần: `organizer.seatMap.title`, `.addZone`, `.editZone`, `.save`
  
- [ ] **QRScanner.tsx**
  - Keys cần: `organizer.scanner.title`, `.scanning`, `.valid`, `.invalid`
  
- [ ] **ScanHistory.tsx**
  - Keys cần: `organizer.scanHistory.title`, `.date`, `.ticket`, `.status`

### Admin Pages (2)
- [ ] **AdminDashboard.tsx**
  - Keys cần: `admin.dashboard.title`, `.users`, `.events`, `.revenue`
  
- [ ] **UserManagement.tsx** ⏳
  - Keys cần: `admin.users.title`, `.search`, `.role`, `.status`, `.actions`
  - **ĐÃ CÓ HOOK** - chỉ cần thay text

---

## 🎯 MẪU THAY THẾ CHO TỪNG LOẠI TRANG

### Mẫu 1: Auth Page
```tsx
import { useTranslation } from 'react-i18next';

export function ResetPassword() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('auth.resetPassword.title')}</h1>
      <form>
        <label>{t('auth.resetPassword.newPassword')}</label>
        <input type="password" placeholder={t('auth.resetPassword.enterNewPassword')} />
        
        <button type="submit">{t('common.submit')}</button>
      </form>
    </div>
  );
}
```

### Mẫu 2: Event Page
```tsx
import { useTranslation } from 'react-i18next';

export function EventDetail() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{event.name}</h1>
      <div>
        <span>{t('events.date')}: {formatDate(event.date)}</span>
        <span>{t('events.location')}: {event.location}</span>
      </div>
      <button>{t('events.bookNow')}</button>
    </div>
  );
}
```

### Mẫu 3: Booking Page
```tsx
import { useTranslation } from 'react-i18next';

export function Cart() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('booking.cart.title')}</h1>
      <table>
        <thead>
          <tr>
            <th>{t('booking.cart.event')}</th>
            <th>{t('booking.cart.quantity')}</th>
            <th>{t('booking.cart.price')}</th>
          </tr>
        </thead>
      </table>
      <button>{t('booking.cart.checkout')}</button>
    </div>
  );
}
```

### Mẫu 4: Organizer Page
```tsx
import { useTranslation } from 'react-i18next';

export function OrganizerDashboard() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('organizer.dashboard.title')}</h1>
      <div className="stats">
        <div>{t('organizer.dashboard.totalEvents')}: {stats.totalEvents}</div>
        <div>{t('organizer.dashboard.revenue')}: ${stats.revenue}</div>
      </div>
    </div>
  );
}
```

---

## 🔍 KIỂM TRA SAU KHI CẬP NHẬT

### Checklist cho mỗi page:
- [ ] ✅ Import `useTranslation` có đúng không?
- [ ] ✅ Hook `const { t } = useTranslation()` có trong component?
- [ ] ✅ Tất cả text đã được thay bằng `t('key')`?
- [ ] ✅ Placeholder trong input dùng `placeholder={t('key')}`?
- [ ] ✅ Test chuyển đổi ngôn ngữ - text có đổi không?
- [ ] ✅ Check console - có lỗi "missing translation" không?

### Test từng page:
1. Mở page trong browser
2. Click vào LanguageSwitcher (icon Globe)
3. Kiểm tra tất cả text đã đổi sang tiếng Việt
4. Click lại để chuyển về English
5. Nếu có text nào không đổi → cần thêm `t()` cho text đó

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Cannot read property 't' of undefined"
**Nguyên nhân**: Chưa thêm hook `useTranslation()`
**Giải pháp**: 
```tsx
const { t } = useTranslation(); // Thêm dòng này
```

### Lỗi: "Missing translation key"
**Nguyên nhân**: Key không tồn tại trong translation.json
**Giải pháp**: Thêm key vào cả 2 file:
- `src/locales/en/translation.json`
- `src/locales/vi/translation.json`

### Text không đổi khi switch language
**Nguyên nhân**: Text vẫn hardcoded
**Giải pháp**: Thay `"text"` thành `{t('key')}`

---

## 📌 LƯU Ý QUAN TRỌNG

### 1. Không dịch những gì?
❌ **KHÔNG dịch**:
- Tên riêng: "Tickify", "PayPal", "Stripe"
- Data từ database: event names, user names
- URL paths
- API endpoints

✅ **CÓ dịch**:
- UI labels: "Save", "Cancel", "Submit"
- Messages: "Success!", "Error occurred"
- Placeholders: "Enter your email"
- Help text: "Password must be 8 characters"

### 2. Key naming convention
```
section.subsection.element
auth.login.title
auth.login.emailLabel
auth.login.submit
```

### 3. Các key common hay dùng
```tsx
t('common.save')
t('common.cancel')
t('common.submit')
t('common.delete')
t('common.edit')
t('common.search')
t('common.filter')
t('common.loading')
t('common.error')
t('common.success')
```

---

## 📈 THEO DÕI TIẾN ĐỘ

Đánh dấu ✅ khi hoàn thành từng page trong checklist trên.

**Mục tiêu**: 39/39 pages = 100% ✨

**Tiến độ hiện tại**: 7/39 = 18% 📊

---

## 🎉 KHI HOÀN THÀNH

1. Test tất cả pages với cả English và Vietnamese
2. Check console không có error "missing translation"
3. Verify localStorage lưu language preference
4. Deploy và test trên production

**Good luck! 🚀**
