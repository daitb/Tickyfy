using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Tickify.Server.AI.Models;

namespace Tickify.Server.AI.Services;

/// <summary>
/// Service for interacting with Ollama LLM
/// Ollama chạy local tại http://localhost:11434
/// </summary>
public interface IOllamaService
{
    /// <summary>
    /// Tạo embedding vector cho text
    /// </summary>
    Task<float[]> GetEmbeddingAsync(string text);
    
    /// <summary>
    /// Tạo embedding cho nhiều text cùng lúc
    /// </summary>
    Task<List<float[]>> GetEmbeddingsAsync(List<string> texts);
    
    /// <summary>
    /// Chat với LLM
    /// </summary>
    Task<string> ChatAsync(string systemPrompt, string userMessage, List<ChatMessage>? history = null);
    
    /// <summary>
    /// Stream chat response
    /// </summary>
    IAsyncEnumerable<string> StreamChatAsync(string systemPrompt, string userMessage, List<ChatMessage>? history = null);
    
    /// <summary>
    /// Kiểm tra Ollama có đang chạy không
    /// </summary>
    Task<bool> IsHealthyAsync();
}

public class OllamaService : IOllamaService
{
    private readonly HttpClient _httpClient;
    private readonly RagConfiguration _config;
    private readonly ILogger<OllamaService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public OllamaService(
        HttpClient httpClient, 
        RagConfiguration config,
        ILogger<OllamaService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        
        _httpClient.BaseAddress = new Uri(_config.OllamaBaseUrl);
        _httpClient.Timeout = TimeSpan.FromMinutes(5); // LLM có thể chậm
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    public async Task<float[]> GetEmbeddingAsync(string text)
    {
        try
        {
            var request = new OllamaEmbedRequest
            {
                Model = _config.EmbeddingModel,
                Prompt = text
            };

            var json = JsonSerializer.Serialize(request, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/api/embeddings", content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<OllamaEmbedResponse>(responseJson, _jsonOptions);

            return result?.Embedding ?? Array.Empty<float>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting embedding from Ollama");
            throw;
        }
    }

    public async Task<List<float[]>> GetEmbeddingsAsync(List<string> texts)
    {
        var embeddings = new List<float[]>();
        
        // Process in batches to avoid overwhelming Ollama
        foreach (var text in texts)
        {
            var embedding = await GetEmbeddingAsync(text);
            embeddings.Add(embedding);
        }
        
        return embeddings;
    }

    public async Task<string> ChatAsync(string systemPrompt, string userMessage, List<ChatMessage>? history = null)
    {
        try
        {
            var messages = BuildMessages(systemPrompt, userMessage, history);
            
            var request = new OllamaChatRequest
            {
                Model = _config.LlmModel,
                Messages = messages,
                Stream = false,
                Options = new OllamaOptions
                {
                    NumCtx = 4096,
                    Temperature = 0.7,
                    NumPredict = 1024
                }
            };

            var json = JsonSerializer.Serialize(request, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/api/chat", content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<OllamaChatResponse>(responseJson, _jsonOptions);

            return result?.Message?.Content ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error chatting with Ollama");
            throw;
        }
    }

    public async IAsyncEnumerable<string> StreamChatAsync(
        string systemPrompt, 
        string userMessage, 
        List<ChatMessage>? history = null)
    {
        var messages = BuildMessages(systemPrompt, userMessage, history);
        
        var request = new OllamaChatRequest
        {
            Model = _config.LlmModel,
            Messages = messages,
            Stream = true,
            Options = new OllamaOptions
            {
                NumCtx = 4096,
                Temperature = 0.7,
                NumPredict = 1024
            }
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/api/chat")
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
            if (string.IsNullOrEmpty(line)) continue;

            var chunk = JsonSerializer.Deserialize<OllamaChatResponse>(line, _jsonOptions);
            if (chunk?.Message?.Content != null)
            {
                yield return chunk.Message.Content;
            }
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/api/tags");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private List<OllamaMessage> BuildMessages(
        string systemPrompt, 
        string userMessage, 
        List<ChatMessage>? history)
    {
        var messages = new List<OllamaMessage>
        {
            new() { Role = "system", Content = systemPrompt }
        };

        // Add conversation history
        if (history != null)
        {
            foreach (var msg in history.TakeLast(10)) // Limit history to last 10 messages
            {
                messages.Add(new OllamaMessage
                {
                    Role = msg.Role,
                    Content = msg.Content
                });
            }
        }

        // Add current user message
        messages.Add(new OllamaMessage
        {
            Role = "user",
            Content = userMessage
        });

        return messages;
    }
}
