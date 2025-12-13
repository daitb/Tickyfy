using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tickify.Server.Models;
using Tickify.Server.Services.AI;

namespace Tickify.Server.Controllers;

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

    [HttpPost("chat")]
    [AllowAnonymous]
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

    [HttpGet("status")]
    [AllowAnonymous]
    public async Task<ActionResult<RagStatus>> GetStatus()
    {
        var status = await _ragService.GetStatusAsync();
        return Ok(status);
    }

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

    [HttpPost("index/faq")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> IndexFaq()
    {
        try
        {
            await _ragService.IndexFaqAsync();
            return Ok(new { message = "Successfully indexed FAQ" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error indexing FAQ");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("reset")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetCollection([FromServices] IQdrantService qdrantService)
    {
        try
        {
            await qdrantService.ClearCollectionAsync();
            await qdrantService.CreateCollectionAsync();
            return Ok(new { message = "Collection reset successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting collection");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
