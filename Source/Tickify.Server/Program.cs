using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Tickify.Data;
using Tickify.Middleware;
using FluentValidation;
using FluentValidation.AspNetCore;
using Tickify.Services.Auth;
using Tickify.Repositories;
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services; // Chứa các Interface chung (IUserService, etc.)
using Tickify.Services;
using Tickify.Services.Email;
using Tickify.Services.Reviews;
using Tickify.Services.Payments;
using Tickify.Services.Refunds;
using Tickify.Services.Payouts;

// [QUAN TRỌNG] Không "using Tickify.Services.Payments" ở trên đầu file 
// để tránh máy tính bị loạn giữa IPaymentService (Interface) và IPaymentService (trong namespace Payments nếu có).
// Chúng ta sẽ gọi trực tiếp bên dưới.

var builder = WebApplication.CreateBuilder(args);

// ============================================
// 1. DATABASE & CONFIG
// ============================================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAutoMapper(typeof(Program).Assembly);
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<Tickify.Models.Momo.MomoOptionModel>(builder.Configuration.GetSection("MomoAPI"));

// ============================================
// 2. SERVICE REGISTRATION (DI)
// ============================================

// --- Auth & User ---
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<Tickify.Interfaces.IAzureStorageService, Tickify.Services.AzureStorageService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAdminService, Tickify.Services.AdminService>();

// --- PAYMENT & REFUND (KHẮC PHỤC TRIỆT ĐỂ LỖI AMBIGUOUS TẠI ĐÂY) ---
// Định nghĩa rõ: Interface và Class đều lấy từ Services.Payments
builder.Services.AddScoped<Tickify.Services.Payments.IPaymentService, Tickify.Services.Payments.PaymentService>();

// Đăng ký các Provider (VNPay, MoMo, CreditCard) vào cùng 1 interface IPaymentProvider để PaymentService nhận được IEnumerable
builder.Services.AddScoped<Tickify.Services.Payments.IPaymentProvider, Tickify.Services.Payments.VNPayProvider>();
builder.Services.AddScoped<Tickify.Services.Payments.IPaymentProvider, Tickify.Services.Payments.MoMoProvider>();
builder.Services.AddScoped<Tickify.Services.Payments.IPaymentProvider, Tickify.Services.Payments.CreditCardProvider>();

builder.Services.AddScoped<Tickify.Services.Refunds.IRefundService, Tickify.Services.Refunds.RefundService>();
builder.Services.AddScoped<IPaymentRepository, EfPaymentRepository>();
builder.Services.AddScoped<IRefundRequestRepository, EfRefundRequestRepository>();
builder.Services.AddScoped<IBookingRepository, EfBookingRepository>();
builder.Services.AddScoped<IReviewRepository, EfReviewRepository>();

// --- Payout ---
builder.Services.AddScoped<IPayoutRepository, EfPayoutRepository>();
// Tương tự, dùng full path để tránh nhầm lẫn nếu có interface trùng tên
builder.Services.AddScoped<Tickify.Services.Payouts.IPayoutService, Tickify.Services.Payouts.PayoutService>();

// --- Event & Ticket ---
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<ITicketRepository, TicketRepository>();
builder.Services.AddScoped<ITicketTransferRepository, TicketTransferRepository>();
builder.Services.AddScoped<ITicketScanRepository, TicketScanRepository>();
builder.Services.AddScoped<ISeatRepository, SeatRepository>();
builder.Services.AddScoped<IPromoCodeRepository, PromoCodeRepository>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IPromoCodeService, PromoCodeService>();

// --- Seat Map ---
builder.Services.AddScoped<ISeatMapRepository, SeatMapRepository>();
builder.Services.AddScoped<ISeatMapService, SeatMapService>();

// --- Category & Organizer & Support ---
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IOrganizerService, OrganizerService>();
builder.Services.AddScoped<ISupportService, SupportService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IWaitlistService, WaitlistService>();

// --- Chat & Notification ---
builder.Services.AddScoped<IChatRepository, EfChatRepository>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<INotificationService, Tickify.Services.Notifications.NotificationService>();

// --- Background Jobs ---
builder.Services.AddHostedService<Tickify.Jobs.SeatReservationCleanupJob>();

// ============================================
// 3. AUTHENTICATION (JWT)
// ============================================
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

if (string.IsNullOrWhiteSpace(secretKey))
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine("⚠️ WARNING: JwtSettings:SecretKey is missing. Using fallback key.");
    Console.ResetColor();
    secretKey = "fallback-secret-key-must-be-very-long-for-security-at-least-32-chars";
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            var accessToken = ctx.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                ctx.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ============================================
// 4. CONFIGURATION (CORS, SIGNALR, SWAGGER)
// ============================================
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? new[] { "http://localhost:3000", "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Tickify API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token: Bearer {token}"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// ============================================
// 5. MIDDLEWARE PIPELINE
// ============================================

// Exception Handling (Đầu tiên)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Database Seeding (Safe Mode - Đảm bảo app không chết nếu DB lỗi)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<ApplicationDbContext>();

    try
    {
        // Tự động tạo database nếu chưa tồn tại
        logger.LogInformation("🔍 Đang kiểm tra database...");
        await context.Database.EnsureCreatedAsync();
        logger.LogInformation("✅ Database đã sẵn sàng.");
        
        // Seed dữ liệu ban đầu
        logger.LogInformation("📝 Đang seed dữ liệu...");
        await DbInitializer.SeedAsync(context);
        logger.LogInformation("✅ Seed data hoàn tất.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Lỗi trong quá trình khởi tạo/Seeding Database: {Message}", ex.Message);
        if (app.Environment.IsDevelopment())
        {
            throw; // Trong dev, throw để dễ debug
        }
    }
}

app.UseMiddleware<RateLimitingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Tickify API V1");
        options.RoutePrefix = string.Empty;
    });
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<Tickify.Hubs.ChatHub>("/hubs/chat");
app.MapHub<Tickify.Hubs.NotificationHub>("/hubs/notifications");
app.MapHub<Tickify.Hubs.SeatHub>("/hubs/seats");

Console.WriteLine("🚀 Tickify API is starting...");
app.Run();