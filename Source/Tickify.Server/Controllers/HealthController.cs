using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tickify.Common;
using Tickify.Data;

namespace Tickify.Controllers;

/// <summary>
/// Health check endpoint để kiểm tra trạng thái hệ thống và database connection
/// </summary>
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(ApplicationDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Kiểm tra health tổng quát của hệ thống
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<HealthCheckDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<HealthCheckDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> CheckHealth()
    {
        var health = new HealthCheckDto
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Version = "1.0.0"
        };

        // Kiểm tra database connection
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            health.Database = new DatabaseHealthDto
            {
                Status = canConnect ? "Connected" : "Disconnected",
                ResponseTimeMs = 0
            };

            if (canConnect)
            {
                // Test query để đo response time
                var startTime = DateTime.UtcNow;
                await _context.Database.ExecuteSqlRawAsync("SELECT 1");
                var endTime = DateTime.UtcNow;
                health.Database.ResponseTimeMs = (int)(endTime - startTime).TotalMilliseconds;
            }
            else
            {
                health.Status = "Unhealthy";
                health.Database.Status = "Disconnected";
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            health.Status = "Unhealthy";
            health.Database = new DatabaseHealthDto
            {
                Status = "Error",
                Error = ex.Message
            };
        }

        if (health.Status == "Unhealthy")
        {
            var response = ApiResponse<HealthCheckDto>.FailureResponse("Hệ thống đang gặp sự cố");
            response.Data = health;
            return StatusCode(503, response);
        }

        return Ok(ApiResponse<HealthCheckDto>.SuccessResponse(
            health,
            "Hệ thống hoạt động bình thường"
        ));
    }

    /// <summary>
    /// Kiểm tra database connection chi tiết
    /// </summary>
    [HttpGet("database")]
    [ProducesResponseType(typeof(ApiResponse<DatabaseHealthDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckDatabase()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var canConnect = await _context.Database.CanConnectAsync();
            var endTime = DateTime.UtcNow;
            var responseTime = (int)(endTime - startTime).TotalMilliseconds;

            if (!canConnect)
            {
                var response = ApiResponse<DatabaseHealthDto>.FailureResponse("Không thể kết nối đến database");
                response.Data = new DatabaseHealthDto
                {
                    Status = "Disconnected",
                    ResponseTimeMs = responseTime
                };
                return StatusCode(503, response);
            }

            // Test query
            startTime = DateTime.UtcNow;
            await _context.Database.ExecuteSqlRawAsync("SELECT 1");
            endTime = DateTime.UtcNow;
            responseTime = (int)(endTime - startTime).TotalMilliseconds;

            // Kiểm tra số lượng bảng
            var tableCount = await _context.Database
                .ExecuteSqlRawAsync("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");

            return Ok(ApiResponse<DatabaseHealthDto>.SuccessResponse(
                new DatabaseHealthDto
                {
                    Status = "Connected",
                    ResponseTimeMs = responseTime
                },
                $"Database kết nối thành công (Response time: {responseTime}ms)"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            var response = ApiResponse<DatabaseHealthDto>.FailureResponse($"Lỗi khi kiểm tra database: {ex.Message}");
            response.Data = new DatabaseHealthDto
            {
                Status = "Error",
                Error = ex.Message
            };
            return StatusCode(503, response);
        }
    }
}

/// <summary>
/// DTO cho health check response
/// </summary>
public class HealthCheckDto
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Version { get; set; } = string.Empty;
    public DatabaseHealthDto Database { get; set; } = new();
}

/// <summary>
/// DTO cho database health status
/// </summary>
public class DatabaseHealthDto
{
    public string Status { get; set; } = string.Empty;
    public int ResponseTimeMs { get; set; }
    public string? Error { get; set; }
}

