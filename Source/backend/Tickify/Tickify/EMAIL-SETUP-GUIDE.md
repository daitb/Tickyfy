# Hướng Dẫn Setup Email Service - Tickify

## Tổng Quan

Dự án Tickify sử dụng SMTP để gửi email (xác thực tài khoản, vé điện tử, thông báo). Hướng dẫn này sẽ giúp bạn cấu hình Gmail hoặc SMTP server khác.

---

## 📧 Option 1: Sử dụng Gmail (Khuyên dùng cho Development)

### Bước 1: Bật 2-Factor Authentication (2FA)

1. Truy cập: https://myaccount.google.com/security
2. Tìm mục **"2-Step Verification"** → Bật lên
3. Làm theo hướng dẫn để xác thực qua điện thoại

### Bước 2: Tạo App Password

1. Sau khi bật 2FA, vào: https://myaccount.google.com/apppasswords
2. Chọn **"Select app"** → **"Mail"**
3. Chọn **"Select device"** → **"Windows Computer"** (hoặc thiết bị của bạn)
4. Nhấn **"Generate"**
5. Google sẽ hiển thị **16-ký tự app password** (ví dụ: `abcd efgh ijkl mnop`)
6. **Copy mật khẩu này** - bạn sẽ không thấy lại!

### Bước 3: Cập nhật appsettings.json

Mở file `appsettings.json` và thay thế:

```json
"Email": {
  "SmtpHost": "smtp.gmail.com",
  "SmtpPort": "587",
  "SmtpUser": "your-email@gmail.com",          // ← Email Gmail của bạn
  "SmtpPassword": "abcd efgh ijkl mnop",        // ← App Password (16 ký tự)
  "FromEmail": "your-email@gmail.com",          // ← Email Gmail của bạn
  "FromName": "Tickify Event Management"
}
```

**Lưu ý:**

- `SmtpUser` và `FromEmail` phải giống nhau (email Gmail)
- `SmtpPassword` là **App Password 16 ký tự**, KHÔNG phải mật khẩu Gmail thông thường
- Port 587 sử dụng TLS (bảo mật)

---

## 📧 Option 2: Sử dụng SMTP Server Khác

### Outlook/Hotmail

```json
"Email": {
  "SmtpHost": "smtp-mail.outlook.com",
  "SmtpPort": "587",
  "SmtpUser": "your-email@outlook.com",
  "SmtpPassword": "your-password",
  "FromEmail": "your-email@outlook.com",
  "FromName": "Tickify"
}
```

### Yahoo Mail

```json
"Email": {
  "SmtpHost": "smtp.mail.yahoo.com",
  "SmtpPort": "587",
  "SmtpUser": "your-email@yahoo.com",
  "SmtpPassword": "your-app-password",   // Yahoo cũng cần App Password
  "FromEmail": "your-email@yahoo.com",
  "FromName": "Tickify"
}
```

### SendGrid (Production - Recommended)

```json
"Email": {
  "SmtpHost": "smtp.sendgrid.net",
  "SmtpPort": "587",
  "SmtpUser": "apikey",                  // Luôn là "apikey"
  "SmtpPassword": "SG.xxxxx",            // SendGrid API Key
  "FromEmail": "noreply@tickify.com",    // Domain đã verify
  "FromName": "Tickify"
}
```

---

## 🔧 Cấu Trúc File Config

### appsettings.json (Main Config)

```json
{
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUser": "tickify.dev@gmail.com",
    "SmtpPassword": "your-16-char-app-password",
    "FromEmail": "tickify.dev@gmail.com",
    "FromName": "Tickify Event Management"
  }
}
```

### appsettings.Development.json (Optional - Override cho Dev)

```json
{
  "Email": {
    "SmtpHost": "smtp.mailtrap.io", // Test SMTP
    "SmtpPort": "2525",
    "SmtpUser": "your-mailtrap-user",
    "SmtpPassword": "your-mailtrap-password",
    "FromEmail": "test@tickify.local",
    "FromName": "Tickify Dev"
  }
}
```

---

## 📝 Email Templates

Template được lưu tại: `Templates/Email/`

### Các Template Có Sẵn:

1. **ticket-confirmation.html** - Vé điện tử (MỚI TẠO)
2. **Welcome.html** - Chào mừng user mới
3. **VerifyEmail.html** - Xác thực email
4. **PasswordReset.html** - Reset mật khẩu

### Cách Sử dụng Template

```csharp
// Trong Controller/Service
var templateData = new Dictionary<string, string>
{
    { "UserName", "Nguyen Van A" },
    { "EventTitle", "Concert Mỹ Tâm 2025" },
    { "EventDate", "December 31, 2025" },
    { "TicketNumber", "TIX-2025-001" }
    // ... thêm các placeholders khác
};

await _emailService.SendEmailFromTemplateAsync(
    to: "user@example.com",
    subject: "Your Ticket for Concert Mỹ Tâm",
    templateName: "ticket-confirmation",    // Tên file (không .html)
    templateData: templateData
);
```

### Placeholders trong ticket-confirmation.html:

- `{UserName}` - Tên người dùng
- `{EventTitle}` - Tên sự kiện
- `{EventVenue}` - Địa điểm
- `{EventDate}` - Ngày (formatted)
- `{EventTime}` - Giờ (formatted)
- `{TicketNumber}` - Mã vé
- `{TicketType}` - Loại vé (VIP, Standard, etc.)
- `{SeatNumber}` - Số ghế
- `{Price}` - Giá (formatted)
- `{BookingNumber}` - Mã booking
- `{QRCode}` - Dữ liệu QR code

---

## ✅ Test Email Configuration

### 1. Test bằng Swagger/Postman

**Endpoint:** `POST /api/tickets/{id}/resend-email`

**Request:**

```http
POST https://localhost:5001/api/tickets/123/resend-email
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Ticket email resent successfully. Check your inbox.",
  "data": {
    "ticketId": 123,
    "emailSent": true
  }
}
```

### 2. Test bằng PowerShell

```powershell
# 1. Login để lấy token
$loginBody = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Method Post `
    -Uri "https://localhost:5001/api/auth/login" `
    -Body $loginBody `
    -ContentType "application/json"

$token = $loginResponse.token

# 2. Gửi lại email vé
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Post `
    -Uri "https://localhost:5001/api/tickets/123/resend-email" `
    -Headers $headers
```

### 3. Kiểm tra logs

Nếu có lỗi, kiểm tra console output hoặc logs:

```bash
# Chạy app và xem logs
cd Source/backend/Tickify/Tickify
dotnet run
```

---

## 🔍 Troubleshooting

### ❌ Lỗi: "The SMTP server requires a secure connection"

**Nguyên nhân:** Port hoặc SSL/TLS config sai  
**Giải pháp:**

- Gmail: Dùng port 587 với TLS (đã config trong EmailService)
- Nếu dùng port 465, cần thay đổi code để dùng SSL

### ❌ Lỗi: "Username and Password not accepted"

**Nguyên nhân:**

1. Chưa bật 2FA (Gmail)
2. Dùng mật khẩu Gmail thay vì App Password
3. Email/Password sai

**Giải pháp:**

1. Bật 2FA: https://myaccount.google.com/security
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Dùng App Password (16 ký tự) trong config

### ❌ Lỗi: "Template not found: ticket-confirmation"

**Nguyên nhân:** File template không tồn tại hoặc đường dẫn sai  
**Giải pháp:**

- Kiểm tra file tồn tại: `Templates/Email/ticket-confirmation.html`
- Đảm bảo file được copy vào output (Build Action = Content)

### ❌ Lỗi: "Booking or user information not found"

**Nguyên nhân:** Ticket không có booking hoặc booking không có user  
**Giải pháp:**

- Kiểm tra database: Booking phải có User navigation property
- Đảm bảo EF Core include User khi query Booking

### ❌ Email gửi chậm hoặc timeout

**Nguyên nhân:** SMTP server chậm, firewall block port 587  
**Giải pháp:**

- Thử ping SMTP server: `ping smtp.gmail.com`
- Kiểm tra firewall/antivirus có block port 587 không
- Tăng timeout trong SmtpClient (nếu cần sửa code)

---

## 🚀 Best Practices cho Production

### 1. Sử dụng Dịch Vụ Email Chuyên Dụng

- **SendGrid** (Free tier: 100 emails/day)
- **Amazon SES** (Rẻ, reliable)
- **Mailgun** (Flexible pricing)
- **Azure Communication Services**

### 2. Không để mật khẩu trong appsettings.json

Sử dụng User Secrets (Development) hoặc Azure Key Vault (Production):

```bash
# Set user secrets (Development)
dotnet user-secrets init
dotnet user-secrets set "Email:SmtpPassword" "your-app-password"
```

```csharp
// Program.cs - Load from Azure Key Vault (Production)
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://{keyVaultName}.vault.azure.net/"),
    new DefaultAzureCredential()
);
```

### 3. Logging & Monitoring

- Log tất cả email gửi (thành công/thất bại)
- Monitor email bounce rate
- Set up alerts cho failed emails

### 4. Rate Limiting

Gmail giới hạn 500 emails/day. Production nên dùng dịch vụ chuyên dụng.

---

## 📚 Tài Liệu Tham Khảo

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- [.NET SMTP Documentation](https://learn.microsoft.com/en-us/dotnet/api/system.net.mail.smtpclient)

---

## 📞 Support

Nếu gặp vấn đề, liên hệ:

- Email: support@tickify.com
- Slack: #tickify-dev
- GitHub Issues: [tickify-event-management/issues]

---

**Cập nhật:** November 11, 2025  
**Phiên bản:** 1.0  
**Tác giả:** Tickify Dev Team
