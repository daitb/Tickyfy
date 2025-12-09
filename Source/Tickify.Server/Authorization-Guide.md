# Hướng dẫn phân quyền (Authorization) trong Tickify

## Tổng quan

Hệ thống phân quyền đã được thiết lập với **5 roles**:
- `guest` - Người dùng chưa đăng nhập
- `user` - Người dùng đã đăng ký (mua vé)
- `organizer` - Người tổ chức sự kiện
- `staff` - Nhân viên quét vé, kiểm tra vé
- `admin` - Quản trị viên hệ thống

## Cấu trúc File

### 1. `/src/types/auth.ts`
File chính định nghĩa permissions cho từng route:

```typescript
export const routePermissions: RoutePermission[] = [
  // Public routes - tất cả đều truy cập được
  { path: "/", allowedRoles: ["guest", "user", "organizer", "staff", "admin"] },
  { path: "/listing", allowedRoles: ["guest", "user", "organizer", "staff", "admin"] },
  
  // User routes - cần đăng nhập
  { path: "/cart", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  
  // Organizer routes - chỉ organizer và admin
  { path: "/organizer-dashboard", allowedRoles: ["organizer", "admin"], redirectTo: "/login" },
  
  // Staff routes - nhân viên và quản lý cấp cao hơn
  { path: "/qr-scanner", allowedRoles: ["staff", "organizer", "admin"], redirectTo: "/login" },
  
  // Admin routes - chỉ admin
  { path: "/admin-dashboard", allowedRoles: ["admin"], redirectTo: "/login" },
];
```

### 2. `/src/components/ProtectedRoute.tsx`
Component bảo vệ routes, tự động redirect nếu không có quyền.

### 3. `/src/App.tsx`
Wrap toàn bộ app trong `<ProtectedRoute>` để kiểm tra quyền truy cập.

## Cách thêm/sửa quyền cho routes

### Ví dụ 1: Thêm route mới chỉ cho Organizer
```typescript
{ 
  path: "/event-reports", 
  allowedRoles: ["organizer", "admin"], 
  redirectTo: "/login" 
}
```

### Ví dụ 2: Cho phép Staff truy cập thêm trang
```typescript
{ 
  path: "/event-management", 
  allowedRoles: ["staff", "organizer", "admin"], // Thêm "staff"
  redirectTo: "/login" 
}
```

### Ví dụ 3: Trang công khai (tất cả có thể truy cập)
```typescript
{ 
  path: "/about", 
  allowedRoles: ["guest", "user", "organizer", "staff", "admin"] 
}
```

## Tính năng tự động

### 1. Auto-redirect sau khi login
Khi người dùng cố truy cập trang không có quyền:
1. Hệ thống redirect về `/login`
2. Lưu URL đã cố truy cập vào `sessionStorage`
3. Sau khi login thành công, tự động redirect về URL đó

### 2. Dynamic role checking
Permissions được kiểm tra mỗi khi:
- URL thay đổi
- User login/logout
- Role thay đổi

## Quyền truy cập theo Role

### Guest (Chưa đăng nhập)
✅ Xem trang chủ, danh sách sự kiện, chi tiết sự kiện
✅ Đăng ký, đăng nhập
❌ Tất cả tính năng khác

### User (Đã đăng nhập)
✅ Tất cả quyền của Guest
✅ Mua vé, giỏ hàng, thanh toán
✅ Xem vé đã mua, chuyển vé
✅ Wishlist, waitlist
✅ Đánh giá sự kiện
✅ Quản lý profile
❌ Tính năng organizer/staff/admin

### Staff (Nhân viên)
✅ Tất cả quyền của User
✅ Quét QR code vé
✅ Xem lịch sử quét vé
❌ Tạo/quản lý sự kiện (trừ khi cũng là organizer)

### Organizer (Người tổ chức)
✅ Tất cả quyền của User và Staff
✅ Tạo sự kiện mới
✅ Quản lý sự kiện của mình
✅ Xem analytics, báo cáo
✅ Quản lý mã giảm giá
✅ Tạo seat map
❌ Admin dashboard

### Admin (Quản trị viên)
✅ Tất cả quyền trong hệ thống
✅ Admin dashboard
✅ Quản lý toàn bộ users, events

## Kiểm tra trong code

### Trong component
```typescript
import { authService } from "./services/authService";

const user = authService.getCurrentUser();
const role = user?.role?.toLowerCase();

if (role === "organizer" || role === "admin") {
  // Show organizer features
}
```

### Trong Header/Navigation
Đã được tích hợp sẵn - menu items tự động hiển thị dựa trên role:
```typescript
{(userRole === "organizer" || userRole === "admin") && (
  <Button onClick={() => onNavigate("organizer-wizard")}>
    Create Event
  </Button>
)}
```

## Testing

Test permissions bằng cách:
1. Tạo accounts với các roles khác nhau trong database
2. Login với từng account
3. Thử truy cập các URLs trực tiếp trong browser
4. Verify redirect hoạt động đúng

## Lưu ý quan trọng

⚠️ **Frontend validation chỉ là UI/UX** - Backend PHẢI validate permissions!

✅ Backend cần:
- Validate JWT token
- Kiểm tra role trong mỗi API endpoint
- Implement role-based authorization với `[Authorize(Roles = "Admin")]`
- Verify ownership (user chỉ sửa data của mình)

Frontend permissions chỉ để:
- Ẩn/hiện UI elements
- Cải thiện UX bằng cách redirect sớm
- Tránh gọi APIs không cần thiết
