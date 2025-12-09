using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Server.AI.Models;
using Tickify.Server.AI.Services;

namespace Tickify.Server.AI.Controllers;

/// <summary>
/// API Controller cho RAG Chatbot
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ChatbotController : ControllerBase
{
    private readonly IRagService _ragService;
    private readonly ILogger<ChatbotController> _logger;

    public ChatbotController(
        IRagService ragService,
        ILogger<ChatbotController> logger)
    {
        _ragService = ragService;
        _logger = logger;
    }

    /// <summary>
    /// Gửi tin nhắn và nhận phản hồi từ chatbot
    /// </summary>
    [HttpPost("chat")]
    [AllowAnonymous] // Hoặc [Authorize] nếu cần đăng nhập
    public async Task<ActionResult<ChatResponse>> Chat([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new ChatResponse
            {
                Success = false,
                Error = "Message cannot be empty"
            });
        }

        try
        {
            var response = await _ragService.ProcessQueryAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat request");
            return StatusCode(500, new ChatResponse
            {
                Success = false,
                Error = "An error occurred while processing your request"
            });
        }
    }

    /// <summary>
    /// Stream phản hồi từ chatbot (Server-Sent Events)
    /// </summary>
    [HttpPost("chat/stream")]
    [AllowAnonymous]
    public async Task StreamChat([FromBody] ChatRequest request)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        try
        {
            await foreach (var chunk in _ragService.StreamQueryAsync(request))
            {
                await Response.WriteAsync($"data: {chunk}\n\n");
                await Response.Body.FlushAsync();
            }

            await Response.WriteAsync("data: [DONE]\n\n");
            await Response.Body.FlushAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming chat response");
            await Response.WriteAsync($"data: [ERROR] {ex.Message}\n\n");
        }
    }

    /// <summary>
    /// Lấy status của RAG system
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    public async Task<ActionResult<RagStatus>> GetStatus()
    {
        var status = await _ragService.GetStatusAsync();
        return Ok(status);
    }

    /// <summary>
    /// Index documents vào vector database
    /// </summary>
    [HttpPost("index")]
    [Authorize(Roles = "Admin")] // Chỉ admin mới được index
    public async Task<IActionResult> IndexDocuments([FromBody] BatchIndexRequest request)
    {
        if (request.Documents == null || !request.Documents.Any())
        {
            return BadRequest("No documents provided");
        }

        try
        {
            await _ragService.IndexDocumentsAsync(request.Documents);
            return Ok(new { message = $"Successfully indexed {request.Documents.Count} documents" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error indexing documents");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Index events từ database vào vector database
    /// </summary>
    [HttpPost("index/events")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> IndexEvents()
    {
        try
        {
            await _ragService.IndexEventsFromDatabaseAsync();
            return Ok(new { message = "Successfully indexed events from database" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error indexing events");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Index file markdown
    /// </summary>
    [HttpPost("index/markdown")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> IndexMarkdown([FromBody] IndexMarkdownRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FilePath))
        {
            return BadRequest("FilePath is required");
        }

        try
        {
            await _ragService.IndexMarkdownFileAsync(request.FilePath);
            return Ok(new { message = $"Successfully indexed {request.FilePath}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error indexing markdown file");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

public class IndexMarkdownRequest
{
    public string FilePath { get; set; } = string.Empty;
}
