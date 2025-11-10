using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Tickify.Data;
using Tickify.Middleware;
using FluentValidation;
using FluentValidation.AspNetCore;

namespace Tickify
{
    public class Program
    {
        public static void Main(string[] args)
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

            // Event Services & Repositories
            builder.Services.AddScoped<Tickify.Interfaces.Repositories.IEventRepository, Tickify.Repositories.EventRepository>();
            builder.Services.AddScoped<Tickify.Interfaces.Services.IEventService, Tickify.Services.EventService>();

            // ============================================
            // 4. JWT AUTHENTICATION CONFIGURATION
            // Cấu hình xác thực JWT token
            // ============================================
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            
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
            });

            builder.Services.AddAuthorization();

            // ============================================
            // 5. CORS CONFIGURATION
            // Cho phép frontend gọi API
            // ============================================
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Vite & React default ports
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                });
            });

            // ============================================
            // 6. CONTROLLERS & JSON OPTIONS
            // ============================================
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                });

            // ============================================
            // 7. SWAGGER CONFIGURATION
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
            // 8. MIDDLEWARE PIPELINE
            // Thứ tự middleware rất quan trọng!
            // ============================================

            // Exception handling (phải đặt đầu tiên)
            app.UseMiddleware<ExceptionHandlingMiddleware>();

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

            app.UseHttpsRedirection();

            // Authentication & Authorization
            app.UseAuthentication(); // Phải đặt trước UseAuthorization
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
