using System.Collections.Concurrent;
using System.Net;

namespace Tickify.Middleware;

/// <summary>
/// Simple in-memory rate limiting middleware
/// For production, consider using AspNetCoreRateLimit or distributed cache
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    
    // In-memory store for rate limiting (use distributed cache in production)
    private static readonly ConcurrentDictionary<string, RateLimitInfo> _rateLimitStore = new();
    
    // Configuration
    private readonly int _maxRequests;
    private readonly TimeSpan _timeWindow;
    private readonly HashSet<string> _protectedPaths;

    public RateLimitingMiddleware(
        RequestDelegate next,
        ILogger<RateLimitingMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        
        // Read configuration
        _maxRequests = configuration.GetValue<int>("RateLimiting:MaxRequests", 100);
        var timeWindowSeconds = configuration.GetValue<int>("RateLimiting:TimeWindowSeconds", 60);
        _timeWindow = TimeSpan.FromSeconds(timeWindowSeconds);
        
        // Protected paths that need stricter rate limiting
        _protectedPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "/api/payment/create-intent",
            "/api/payment/verify",
            "/api/payment/verify-return-url",
            "/api/payment/webhook"
        };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        
        // Only apply rate limiting to protected paths
        if (!_protectedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        // Get client identifier (IP address or user ID if authenticated)
        var clientId = GetClientIdentifier(context);
        
        // Check rate limit
        if (!IsWithinRateLimit(clientId, path))
        {
            _logger.LogWarning(
                "[RateLimiting] Rate limit exceeded for {ClientId} on {Path}",
                clientId, path);
            
            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.ContentType = "application/json";
            
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Rate limit exceeded. Please try again later.",
                retryAfter = _timeWindow.TotalSeconds
            });
            
            return;
        }

        await _next(context);
    }

    private string GetClientIdentifier(HttpContext context)
    {
        // If user is authenticated, use user ID (more accurate)
        var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            return $"user:{userId}";
        }

        // Otherwise, use IP address
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        
        // Handle X-Forwarded-For header (for proxies/load balancers)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            var firstIp = forwardedFor.Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrEmpty(firstIp))
            {
                ip = firstIp;
            }
        }

        return $"ip:{ip}";
    }

    private bool IsWithinRateLimit(string clientId, string path)
    {
        var key = $"{clientId}:{path}";
        var now = DateTime.UtcNow;

        // Clean up old entries periodically
        if (DateTime.UtcNow.Second % 60 == 0) // Every minute
        {
            CleanupOldEntries(now);
        }

        var rateLimitInfo = _rateLimitStore.AddOrUpdate(
            key,
            new RateLimitInfo { Count = 1, ResetTime = now.Add(_timeWindow) },
            (k, existing) =>
            {
                // If time window has passed, reset
                if (now >= existing.ResetTime)
                {
                    return new RateLimitInfo { Count = 1, ResetTime = now.Add(_timeWindow) };
                }

                // Increment count
                existing.Count++;
                return existing;
            });

        return rateLimitInfo.Count <= _maxRequests;
    }

    private void CleanupOldEntries(DateTime now)
    {
        var keysToRemove = _rateLimitStore
            .Where(kvp => now >= kvp.Value.ResetTime)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var key in keysToRemove)
        {
            _rateLimitStore.TryRemove(key, out _);
        }
    }

    private class RateLimitInfo
    {
        public int Count { get; set; }
        public DateTime ResetTime { get; set; }
    }
}

