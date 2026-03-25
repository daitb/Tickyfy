# Tickify — Nền tảng Quản lý Sự kiện & Bán vé Trực tuyến

## Mô tả dự án

**Tickify** là một nền tảng quản lý sự kiện và bán vé trực tuyến toàn diện, cho phép người dùng tìm kiếm, đặt vé và quản lý các sự kiện (hòa nhạc, thể thao, hội thảo, v.v.) một cách dễ dàng. Hệ thống hỗ trợ nhiều cổng thanh toán (VNPay, MoMo, Stripe, payOS), phát hành vé điện tử kèm mã QR, tính năng chuyển nhượng vé, và chatbot AI (RAG) hỗ trợ người dùng 24/7. Phía ban tổ chức có thể tạo và quản lý sự kiện, cấu hình loại vé, theo dõi doanh thu, và xử lý hoàn tiền.

> **CV Description (English):**
> Developed a full-stack event management and online ticketing platform (Tickify) with features including event discovery, multi-gateway payment processing (VNPay, MoMo, Stripe, payOS), QR-code e-ticket generation, real-time notifications via SignalR, and a RAG-based AI chatbot for customer support. Built a RESTful API with .NET 9 and a responsive SPA with React + TypeScript, deployed via a GitLab CI/CD pipeline.

---

## Tech Stack

### Backend
| Công nghệ | Vai trò |
|-----------|---------|
| **.NET 9 / ASP.NET Core Web API** | Framework chính cho REST API |
| **C#** | Ngôn ngữ lập trình backend |
| **Entity Framework Core 9** | ORM – truy vấn và migration cơ sở dữ liệu |
| **SQL Server** | Cơ sở dữ liệu quan hệ chính |
| **JWT Bearer + Google OAuth** | Xác thực và phân quyền người dùng |
| **SignalR** | Giao tiếp thời gian thực (WebSocket) |
| **Hangfire** | Xử lý tác vụ nền (background jobs) |
| **FluentValidation** | Kiểm tra dữ liệu đầu vào |
| **AutoMapper** | Mapping giữa Model và DTO |
| **Serilog** | Logging |
| **MailKit** | Gửi email thông báo |
| **QRCoder + SkiaSharp** | Tạo và xử lý mã QR cho vé điện tử |
| **Azure Blob / Table / Queue Storage** | Lưu trữ tệp và hàng đợi đám mây |
| **Groq API + HuggingFace + Qdrant** | AI Chatbot (RAG – Retrieval-Augmented Generation) |
| **Swagger / OpenAPI** | Tài liệu hóa API |
| **BCrypt.Net** | Mã hóa mật khẩu |
| **xUnit + Moq** | Unit testing |

### Frontend
| Công nghệ | Vai trò |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript 5** | Ngôn ngữ lập trình frontend |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **Radix UI** | Thư viện component UI headless |
| **React Router DOM 6** | Routing phía client |
| **React Hook Form** | Quản lý form |
| **Axios** | HTTP client giao tiếp với API |
| **@microsoft/signalr** | Nhận thông báo thời gian thực |
| **Recharts** | Biểu đồ thống kê doanh thu |
| **i18next / react-i18next** | Đa ngôn ngữ (Tiếng Việt + English) |
| **qrcode.react** | Hiển thị mã QR vé điện tử |
| **@react-oauth/google** | Đăng nhập Google |
| **date-fns** | Xử lý ngày/giờ |
| **Sonner** | Toast notification |
| **ESLint** | Linting và kiểm tra code style |

### DevOps & CI/CD
| Công nghệ | Vai trò |
|-----------|---------|
| **Git / GitLab** | Quản lý phiên bản |
| **GitLab CI/CD** | Pipeline tự động hoá build, test, deploy |

---

## Tính năng nổi bật

- 🎟️ Đặt vé sự kiện với nhiều loại vé và giới hạn số lượng
- 💳 Thanh toán đa cổng: VNPay, MoMo, Stripe, payOS
- 📲 Vé điện tử kèm mã QR, hỗ trợ chuyển nhượng vé
- 🔔 Thông báo thời gian thực qua SignalR
- 🤖 Chatbot AI hỗ trợ 24/7 (RAG với Groq + Qdrant)
- 📊 Dashboard phân tích doanh thu cho ban tổ chức
- 🌐 Giao diện đa ngôn ngữ (Tiếng Việt & English)
- 🔒 Xác thực JWT + OAuth2 (Google)
