using System.Text;
using System.Text.Json;
using Tickify.Server.Models;

namespace Tickify.Server.Services.AI;

public interface IEmbeddingService
{
    /// Tạo embedding vector cho text
    Task<float[]> GetEmbeddingAsync(string text);

    /// Kiểm tra service có hoạt động không
    Task<bool> IsHealthyAsync();
}

/// <summary>
/// Embedding service sử dụng Jina AI Embeddings API (MIỄN PHÍ 1M tokens/tháng)
/// https://jina.ai/embeddings/ - Model: jina-embeddings-v3 (1024 dimensions)
/// </summary>
public class JinaEmbeddingService : IEmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly RagConfiguration _config;
    private readonly ILogger<JinaEmbeddingService> _logger;

    // Jina AI Embeddings API - MIỄN PHÍ 1 triệu tokens/tháng
    private const string JinaApiUrl = "https://api.jina.ai/v1/embeddings";

    public JinaEmbeddingService(
        HttpClient httpClient,
        RagConfiguration config,
        ILogger<JinaEmbeddingService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;

        if (!string.IsNullOrEmpty(config.JinaApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.JinaApiKey}");
        }
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<float[]> GetEmbeddingAsync(string text)
    {
        const int maxRetries = 3;
        
        for (int retry = 0; retry < maxRetries; retry++)
        {
            try
            {
                var request = new
                {
                    model = "jina-embeddings-v3",
                    task = "retrieval.passage", // hoặc "retrieval.query" cho query
                    dimensions = _config.VectorSize, // Jina cho phép chọn dimensions
                    input = new[] { text }
                };
                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogDebug("Calling Jina API for text: {TextPreview}...", text.Length > 50 ? text[..50] : text);

                var response = await _httpClient.PostAsync(JinaApiUrl, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Jina API failed: {Status} - {Body}", response.StatusCode, responseJson);
                    
                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    {
                        _logger.LogInformation("Rate limited, waiting... (attempt {Retry}/{Max})", retry + 1, maxRetries);
                        await Task.Delay(2000 * (retry + 1));
                        continue;
                    }
                    
                    throw new HttpRequestException($"Jina API error: {response.StatusCode} - {responseJson}");
                }

                // Parse Jina response format
                using var doc = JsonDocument.Parse(responseJson);
                var dataArray = doc.RootElement.GetProperty("data");
                var firstItem = dataArray.EnumerateArray().First();
                var embeddingArray = firstItem.GetProperty("embedding");
                
                var embedding = new float[embeddingArray.GetArrayLength()];
                int i = 0;
                foreach (var val in embeddingArray.EnumerateArray())
                {
                    embedding[i++] = val.GetSingle();
                }

                _logger.LogDebug("Got Jina embedding with {Dims} dimensions", embedding.Length);
                return embedding;
            }
            catch (Exception ex) when (retry < maxRetries - 1)
            {
                _logger.LogWarning(ex, "Jina API error, retrying... (attempt {Retry}/{Max})", retry + 1, maxRetries);
                await Task.Delay(1000 * (retry + 1));
            }
        }
        
        throw new InvalidOperationException("Failed to get embedding from Jina after all retries");
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var embedding = await GetEmbeddingAsync("test");
            return embedding.Length > 0;
        }
        catch
        {
            return false;
        }
    }
}
