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
/// Embedding service sử dụng HuggingFace Inference API (miễn phí)
/// </summary>
public class HuggingFaceEmbeddingService : IEmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly RagConfiguration _config;
    private readonly ILogger<HuggingFaceEmbeddingService> _logger;
    private readonly SimpleEmbeddingService _fallbackService;

    private const string HfApiUrl = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";

    public HuggingFaceEmbeddingService(
        HttpClient httpClient,
        RagConfiguration config,
        ILogger<HuggingFaceEmbeddingService> logger,
        ILogger<SimpleEmbeddingService> simpleLogger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        _fallbackService = new SimpleEmbeddingService(config, simpleLogger);

        if (!string.IsNullOrEmpty(config.HuggingFaceApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.HuggingFaceApiKey}");
        }
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<float[]> GetEmbeddingAsync(string text)
    {
        try
        {
            var request = new { inputs = text };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(HfApiUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("HuggingFace API failed, using fallback. Status: {Status}", response.StatusCode);
                return await _fallbackService.GetEmbeddingAsync(text);
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var embedding = JsonSerializer.Deserialize<float[]>(responseJson);

            return embedding ?? await _fallbackService.GetEmbeddingAsync(text);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "HuggingFace API error, using fallback");
            return await _fallbackService.GetEmbeddingAsync(text);
        }
    }

    public async Task<List<float[]>> GetEmbeddingsAsync(List<string> texts)
    {
        var embeddings = new List<float[]>();
        
        foreach (var text in texts)
        {
            var embedding = await GetEmbeddingAsync(text);
            embeddings.Add(embedding);
            
            // Rate limiting - HuggingFace free tier has limits
            await Task.Delay(100);
        }

        return embeddings;
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
