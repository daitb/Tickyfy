using System.Text;
using System.Text.Json;
using Tickify.Server.AI.Models;

namespace Tickify.Server.AI.Services;

/// <summary>
/// Service tạo embeddings sử dụng các API miễn phí
/// Sử dụng HuggingFace Inference API (miễn phí) hoặc local calculation
/// </summary>
public interface IEmbeddingService
{
    /// <summary>
    /// Tạo embedding vector cho text
    /// </summary>
    Task<float[]> GetEmbeddingAsync(string text);

    /// <summary>
    /// Tạo embeddings cho nhiều texts
    /// </summary>
    Task<List<float[]>> GetEmbeddingsAsync(List<string> texts);

    /// <summary>
    /// Kiểm tra service có hoạt động không
    /// </summary>
    Task<bool> IsHealthyAsync();
}

/// <summary>
/// Simple embedding service using TF-IDF like approach
/// Không cần external API, chạy hoàn toàn local
/// </summary>
public class SimpleEmbeddingService : IEmbeddingService
{
    private readonly ILogger<SimpleEmbeddingService> _logger;
    private readonly int _vectorSize;

    public SimpleEmbeddingService(
        RagConfiguration config,
        ILogger<SimpleEmbeddingService> logger)
    {
        _logger = logger;
        _vectorSize = config.VectorSize;
    }

    public Task<float[]> GetEmbeddingAsync(string text)
    {
        var embedding = CreateSimpleEmbedding(text);
        return Task.FromResult(embedding);
    }

    public Task<List<float[]>> GetEmbeddingsAsync(List<string> texts)
    {
        var embeddings = texts.Select(CreateSimpleEmbedding).ToList();
        return Task.FromResult(embeddings);
    }

    public Task<bool> IsHealthyAsync()
    {
        return Task.FromResult(true);
    }

    /// <summary>
    /// Tạo embedding đơn giản dựa trên hash của các từ
    /// Phương pháp này không tốt bằng neural embeddings nhưng hoạt động offline
    /// </summary>
    private float[] CreateSimpleEmbedding(string text)
    {
        var embedding = new float[_vectorSize];
        
        if (string.IsNullOrWhiteSpace(text))
            return embedding;

        // Tokenize và normalize
        var words = text.ToLowerInvariant()
            .Split(new[] { ' ', '\t', '\n', '\r', '.', ',', '!', '?', ';', ':' }, 
                   StringSplitOptions.RemoveEmptyEntries);

        // Tạo embedding dựa trên hash của từng từ
        foreach (var word in words)
        {
            var hash = GetStableHash(word);
            
            // Distribute the word across multiple dimensions
            for (var i = 0; i < 5; i++)
            {
                var index = Math.Abs((hash + i * 31) % _vectorSize);
                var value = ((hash >> (i * 4)) & 0xF) / 15.0f - 0.5f;
                embedding[index] += value;
            }
        }

        // Normalize vector
        var magnitude = (float)Math.Sqrt(embedding.Sum(x => x * x));
        if (magnitude > 0)
        {
            for (var i = 0; i < embedding.Length; i++)
            {
                embedding[i] /= magnitude;
            }
        }

        return embedding;
    }

    private static int GetStableHash(string str)
    {
        unchecked
        {
            int hash = 17;
            foreach (char c in str)
            {
                hash = hash * 31 + c;
            }
            return hash;
        }
    }
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

    public async Task<List<float[]>> GetEmbeddingsAsync(List<string> texts)
    {
        // Jina hỗ trợ batch request
        const int maxRetries = 3;
        
        for (int retry = 0; retry < maxRetries; retry++)
        {
            try
            {
                var request = new
                {
                    model = "jina-embeddings-v3",
                    task = "retrieval.passage",
                    dimensions = _config.VectorSize,
                    input = texts.ToArray()
                };
                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(JinaApiUrl, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Jina batch API failed: {Status}", response.StatusCode);
                    throw new HttpRequestException($"Jina API error: {response.StatusCode}");
                }

                using var doc = JsonDocument.Parse(responseJson);
                var dataArray = doc.RootElement.GetProperty("data");
                
                var embeddings = new List<float[]>();
                foreach (var item in dataArray.EnumerateArray().OrderBy(x => x.GetProperty("index").GetInt32()))
                {
                    var embeddingArray = item.GetProperty("embedding");
                    var embedding = new float[embeddingArray.GetArrayLength()];
                    int i = 0;
                    foreach (var val in embeddingArray.EnumerateArray())
                    {
                        embedding[i++] = val.GetSingle();
                    }
                    embeddings.Add(embedding);
                }

                return embeddings;
            }
            catch (Exception ex) when (retry < maxRetries - 1)
            {
                _logger.LogWarning(ex, "Jina batch API error, retrying...");
                await Task.Delay(1000 * (retry + 1));
            }
        }
        
        // Fallback to individual calls
        var result = new List<float[]>();
        foreach (var text in texts)
        {
            result.Add(await GetEmbeddingAsync(text));
            await Task.Delay(50);
        }
        return result;
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
