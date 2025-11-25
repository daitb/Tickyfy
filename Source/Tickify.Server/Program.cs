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

// [ADD] using cho DI của Payment/Refund/Repositories
using Tickify.Services.Payments;              // PaymentService, VNPayProvider, MoMoProvider
using Tickify.Services.Refunds;              // RefundService
using Tickify.Services.Payouts;              // PayoutService
using Tickify.Repositories;                  // EfPaymentRepository, EfRefundRequestRepository, EfPayoutRepository
using Tickify.Interfaces.Repositories;
using Tickify.Interfaces.Services;
using Tickify.Services;       // IBookingRepository, IPaymentRepository, IRefundRequestRepository

namespace Tickify
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ============================================
            // 1. DATABASE CONFIGURATION
            // ============================================
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // ============================================
            // 2. AUTOMAPPER CONFIGURATION
            // Tự động map giữa Models và DTOs
            // ============================================
            builder.Services.AddAutoMapper(typeof(Program).Assembly);

            // ============================================
            // 3. FLUENT VALIDATION CONFIGURATION
            // Validation cho tất cả DTOs
            // ============================================
            builder.Services.AddFluentValidationAutoValidation();
            builder.Services.AddValidatorsFromAssemblyContaining<Program>();

            // ============================================
            // 3.5. SERVICES REGISTRATION
            // Đăng ký các services: JWT, Email, Azure Storage, etc.
            // ============================================
            builder.Services.AddScoped<Tickify.Services.Auth.IJwtService, Tickify.Services.Auth.JwtService>();
            builder.Services.AddScoped<Tickify.Services.Email.IEmailService, Tickify.Services.Email.EmailService>();
            builder.Services.AddScoped<Tickify.Interfaces.IAzureStorageService, Tickify.Services.AzureStorageService>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();
            builder.Services.AddScoped<IRoleRepository, RoleRepository>();
            builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IFileUploadService, FileUploadService>();
            builder.Services.AddScoped<Tickify.Services.Reviews.IReviewService, Tickify.Services.Reviews.ReviewService>();
            builder.Services.AddScoped<Tickify.Interfaces.Services.IAdminService, Tickify.Services.AdminService>();


            // [ADD] HttpClient + HttpContextAccessor (MoMoProvider dùng HttpClient; controller cần lấy IP)
            builder.Services.AddHttpClient();
            builder.Services.AddHttpContextAccessor();

            // [ADD] Configure MoMo options from appsettings.json
            builder.Services.Configure<Tickify.Models.Momo.MomoOptionModel>(
                builder.Configuration.GetSection("MomoAPI"));

            // [ADD] Đăng ký Payment/Refund theo Week 2 (không ảnh hưởng module khác)
            builder.Services.AddScoped<IReviewRepository, EfReviewRepository>();
            builder.Services.AddScoped<IBookingRepository, EfBookingRepository>(); // <-- THÊM DÒNG NÀY
            builder.Services.AddScoped<IPaymentRepository, EfPaymentRepository>();
            builder.Services.AddScoped<IRefundRequestRepository, EfRefundRequestRepository>();
            builder.Services.AddScoped<Services.Payments.IPaymentService, PaymentService>();
            builder.Services.AddScoped<IPaymentProvider, VNPayProvider>();
            builder.Services.AddScoped<IPaymentProvider, MoMoProvider>();
            builder.Services.AddScoped<IRefundService, RefundService>();

            // Payout Services & Repositories
            builder.Services.AddScoped<IPayoutRepository, EfPayoutRepository>();
            builder.Services.AddScoped<Services.Payouts.IPayoutService, Services.Payouts.PayoutService>();

            // [NOTE] Nếu IBookingRepository CHƯA được đăng ký ở nơi khác thì thêm dòng dưới:
            // builder.Services.AddScoped<IBookingRepository, EfBookingRepository>(); // <-- chỉ bật nếu bạn đã có EfBookingRepository

            // Event Services & Repositories
            builder.Services.AddScoped<Tickify.Interfaces.Repositories.IEventRepository, Tickify.Repositories.EventRepository>();
            builder.Services.AddScoped<Tickify.Interfaces.Services.IEventService, Tickify.Services.EventService>();

            // Ticket Services & Repositories (Dev 3)
            builder.Services.AddScoped<Tickify.Interfaces.Repositories.ITicketRepository, Tickify.Repositories.TicketRepository>();
            builder.Services.AddScoped<Tickify.Interfaces.Repositories.ITicketTransferRepository, Tickify.Repositories.TicketTransferRepository>();
            builder.Services.AddScoped<Tickify.Interfaces.Repositories.ITicketScanRepository, Tickify.Repositories.TicketScanRepository>();
            builder.Services.AddScoped<Tickify.Interfaces.Repositories.ISeatRepository, Tickify.Repositories.SeatRepository>();
            builder.Services.AddScoped<Tickify.Interfaces.Repositories.IPromoCodeRepository, Tickify.Repositories.PromoCodeRepository>();
            builder.Services.AddScoped<Tickify.Interfaces.Services.ITicketService, Tickify.Services.TicketService>();
            builder.Services.AddScoped<Tickify.Interfaces.Services.IBookingService, Tickify.Services.BookingService>();
            builder.Services.AddScoped<Tickify.Interfaces.Services.IPromoCodeService, Tickify.Services.PromoCodeService>();
            
            // Seat Management Services & Repositories (Week 2 - Seat Selection)
            builder.Services.AddScoped<Tickify.Repositories.ISeatMapRepository, Tickify.Repositories.SeatMapRepository>();
            builder.Services.AddScoped<Tickify.Services.ISeatMapService, Tickify.Services.SeatMapService>();

            // Category, Organizer & Support Services (Developer 2 - Week 2)
            builder.Services.AddScoped<ICategoryService, CategoryService>();
            builder.Services.AddScoped<IOrganizerService, OrganizerService>();
            builder.Services.AddScoped<ISupportService, SupportService>();

            // Chat Services & Repositories
            builder.Services.AddScoped<IChatRepository, EfChatRepository>();
            builder.Services.AddScoped<IChatService, ChatService>();

            // ============================================
            // 4. JWT AUTHENTICATION CONFIGURATION
            // Cấu hình xác thực JWT token
            // ============================================
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];

            // [ADD] Guard nhẹ để dễ debug cấu hình thiếu (không phá runtime Production)
            if (string.IsNullOrWhiteSpace(secretKey))
            {
                builder.Logging.AddConsole();
                builder.Logging.AddDebug();
                var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole().AddDebug());
                var logger = loggerFactory.CreateLogger("Startup");
                logger.LogWarning("JwtSettings:SecretKey is missing or empty. Please configure appsettings.");
                secretKey = "fallback-key-please-change"; // fallback tránh crash dev; đổi ngay ở appsettings!
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
                    ClockSkew = TimeSpan.Zero // Token hết hạn chính xác
                };

                // [ADD] Cho phép đọc token từ query cho SignalR
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = ctx => {
                        var accessToken = ctx.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(accessToken) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                            ctx.Token = accessToken;
                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddAuthorization();

            // ============================================
            // 5. CORS CONFIGURATION
            // Cho phép frontend gọi API (đọc từ appsettings.json)
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

            // ============================================
            // 6. SIGNALR CONFIGURATION (Real-time chat)
            // ============================================
            builder.Services.AddSignalR();

            // ============================================
            // 7. CONTROLLERS & JSON OPTIONS
            // ============================================
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                    // [ADD] Giới hạn độ sâu JSON để tránh reference loop lớn (tuỳ ý)
                    options.JsonSerializerOptions.MaxDepth = 64;
                });

            // ============================================
            // 8. SWAGGER CONFIGURATION
            // API documentation với JWT support
            // ============================================
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Tickify API",
                    Version = "v1",
                    Description = "Event Management & Ticket Booking System API",
                    Contact = new OpenApiContact
                    {
                        Name = "Tickify Team",
                        Email = "support@tickify.com"
                    }
                });

                // Thêm JWT Authentication vào Swagger
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Nhập JWT token. Ví dụ: Bearer {your token}"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            var app = builder.Build();

            // ============================================
            // 7.5. DATABASE INITIALIZATION
            // Apply migrations và seed dữ liệu ban đầu
            // ============================================
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var logger = services.GetRequiredService<ILogger<Program>>();
                var context = services.GetRequiredService<ApplicationDbContext>();

                try
                {
                    logger.LogInformation("Đang kiểm tra và apply database migrations...");
                    
                    // Apply pending migrations
                    await context.Database.MigrateAsync();
                    logger.LogInformation("✅ Database migrations đã được apply thành công");

                    // Seed dữ liệu ban đầu (Roles, Categories, Admin user)
                    logger.LogInformation("Đang seed dữ liệu ban đầu...");
                    await DbInitializer.SeedAsync(context);
                    logger.LogInformation("✅ Database seeding hoàn tất");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ Lỗi khi khởi tạo database: {Message}", ex.Message);
                    // Không throw để app vẫn có thể start, nhưng log lỗi rõ ràng
                    // Trong production có thể muốn throw để fail fast
                    if (app.Environment.IsDevelopment())
                    {
                        throw; // Trong dev, throw để dễ debug
                    }
                }
            }

            // ============================================
            // 8. MIDDLEWARE PIPELINE
            // Thứ tự middleware rất quan trọng!
            // ============================================

            // Exception handling (phải đặt đầu tiên)
            app.UseMiddleware<ExceptionHandlingMiddleware>();

            // Rate limiting (đặt sau exception handling, trước authentication)
            app.UseMiddleware<RateLimitingMiddleware>();

            // Swagger (chỉ trong Development)
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Tickify API V1");
                    options.RoutePrefix = string.Empty; // Swagger tại root URL
                });
            }

            // CORS (cho phép frontend call API)
            app.UseCors("AllowFrontend");

            // app.UseHttpsRedirection();

            // Authentication & Authorization
            app.UseAuthentication(); // Phải đặt trước UseAuthorization
            app.UseAuthorization();

            app.MapControllers();

            // Map SignalR hub
            app.MapHub<Tickify.Hubs.ChatHub>("/hubs/chat");

            await app.RunAsync();
        }
    }
}
