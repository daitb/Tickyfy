using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Tickify.Server.AI.Models;

namespace Tickify.Server.AI.Services;

/// <summary>
/// Service for interacting with Groq Cloud API
/// Groq cung cấp inference LLM cực nhanh và miễn phí
/// Free tier: 14,400 requests/day, 30 requests/minute
/// </summary>
public interface IGroqService
{
    /// <summary>
    /// Chat với LLM qua Groq
    /// </summary>
    Task<string> ChatAsync(string systemPrompt, string userMessage, List<ChatMessage>? history = null);
    
    /// <summary>
    /// Stream chat response
    /// </summary>
    IAsyncEnumerable<string> StreamChatAsync(string systemPrompt, string userMessage, List<ChatMessage>? history = null);
    
    /// <summary>
    /// Kiểm tra API có hoạt động không
    /// </summary>
    Task<bool> IsHealthyAsync();
}

public class GroqService : IGroqService
{
    private readonly HttpClient _httpClient;
    private readonly RagConfiguration _config;
    private readonly ILogger<GroqService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    private const string GroqApiUrl = "https://api.groq.com/openai/v1/chat/completions";

    public GroqService(
        HttpClient httpClient,
        RagConfiguration config,
        ILogger<GroqService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;

        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.GroqApiKey}");
        _httpClient.Timeout = TimeSpan.FromMinutes(2);

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    public async Task<string> ChatAsync(string systemPrompt, string userMessage, List<ChatMessage>? history = null)
    {
        try
        {
            var messages = BuildMessages(systemPrompt, userMessage, history);

            var request = new GroqChatRequest
            {
                Model = _config.GroqModel,
                Messages = messages,
                Temperature = 0.7,
                MaxTokens = 1024,
                Stream = false
            };

            var json = JsonSerializer.Serialize(request, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(GroqApiUrl, content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Groq API error: {Status} - {Body}", response.StatusCode, errorBody);
                throw new Exception($"Groq API error: {response.StatusCode}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GroqChatResponse>(responseJson, _jsonOptions);

            return result?.Choices?.FirstOrDefault()?.Message?.Content ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error chatting with Groq");
            throw;
        }
    }

    public async IAsyncEnumerable<string> StreamChatAsync(
        string systemPrompt,
        string userMessage,
        List<ChatMessage>? history = null)
    {
        var messages = BuildMessages(systemPrompt, userMessage, history);

        var request = new GroqChatRequest
        {
            Model = _config.GroqModel,
            Messages = messages,
            Temperature = 0.7,
            MaxTokens = 1024,
            Stream = true
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, GroqApiUrl)
        {
            Content = content
        };

        using var response = await _httpClient.SendAsync(
            httpRequest,
            HttpCompletionOption.ResponseHeadersRead);

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrEmpty(line) || !line.StartsWith("data: ")) continue;

            var data = line[6..]; // Remove "data: " prefix
            if (data == "[DONE]") break;

            // Parse chunk outside of try-catch to allow yield
            var deltaContent = ParseStreamChunk(data);
            if (!string.IsNullOrEmpty(deltaContent))
            {
                yield return deltaContent;
            }
        }
    }

    /// <summary>
    /// Parse stream chunk và trả về content
    /// </summary>
    private string? ParseStreamChunk(string data)
    {
        try
        {
            var chunk = JsonSerializer.Deserialize<GroqStreamChunk>(data, _jsonOptions);
            return chunk?.Choices?.FirstOrDefault()?.Delta?.Content;
        }
        catch (JsonException)
        {
            // Skip malformed JSON
            return null;
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            // Simple health check - just verify API key is valid
            var request = new GroqChatRequest
            {
                Model = _config.GroqModel,
                Messages = new List<GroqMessage>
                {
                    new() { Role = "user", Content = "Hi" }
                },
                MaxTokens = 5
            };

            var json = JsonSerializer.Serialize(request, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(GroqApiUrl, content);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private List<GroqMessage> BuildMessages(
        string systemPrompt,
        string userMessage,
        List<ChatMessage>? history)
    {
        var messages = new List<GroqMessage>
        {
            new() { Role = "system", Content = systemPrompt }
        };

        // Add conversation history
        if (history != null)
        {
            foreach (var msg in history.TakeLast(10))
            {
                messages.Add(new GroqMessage
                {
                    Role = msg.Role,
                    Content = msg.Content
                });
            }
        }

        // Add current user message
        messages.Add(new GroqMessage
        {
            Role = "user",
            Content = userMessage
        });

        return messages;
    }
}

#region Groq API Models

public class GroqChatRequest
{
    public string Model { get; set; } = "llama-3.1-8b-instant";
    public List<GroqMessage> Messages { get; set; } = new();
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 1024;
    public bool Stream { get; set; } = false;
}

public class GroqMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class GroqChatResponse
{
    public List<GroqChoice>? Choices { get; set; }
    public GroqUsage? Usage { get; set; }
}

public class GroqChoice
{
    public GroqMessage? Message { get; set; }
    public GroqDelta? Delta { get; set; }
    public string? FinishReason { get; set; }
}

public class GroqDelta
{
    public string? Content { get; set; }
}

public class GroqStreamChunk
{
    public List<GroqChoice>? Choices { get; set; }
}

public class GroqUsage
{
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
}

#endregion
