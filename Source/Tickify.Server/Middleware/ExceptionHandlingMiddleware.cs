using System.Net;
using System.Text.Json;
using Tickify.Common;
using Tickify.Exceptions;

namespace Tickify.Middleware;


public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Gọi middleware tiếp theo trong pipeline
            await _next(context);
        }
        catch (Exception ex)
        {
            // Log exception
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            
            // Xử lý exception và trả về response
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Set response content type
        context.Response.ContentType = "application/json";

        // Xác định status code và message dựa trên loại exception
        var (statusCode, message, errors) = exception switch
        {
            NotFoundException => (HttpStatusCode.NotFound, exception.Message, null),
            BadRequestException badRequestEx => (HttpStatusCode.BadRequest, badRequestEx.Message, badRequestEx.Errors),
            UnauthorizedException => (HttpStatusCode.Unauthorized, exception.Message, null),
            ForbiddenException => (HttpStatusCode.Forbidden, exception.Message, null),
            ConflictException => (HttpStatusCode.Conflict, exception.Message, null),
            _ => (HttpStatusCode.InternalServerError, "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.", null)
        };

        context.Response.StatusCode = (int)statusCode;

        // Tạo response object
        var response = ApiResponse<object>.FailureResponse(message, errors);

        // Serialize và trả về
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
