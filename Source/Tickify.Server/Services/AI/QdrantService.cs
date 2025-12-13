using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Tickify.Server.Models;

namespace Tickify.Server.Services.AI;

/// <summary>
/// Service for interacting with Qdrant Vector Database
/// Qdrant chạy local tại http://localhost:6333
/// </summary>
public interface IQdrantService
{
    /// Tạo collection mới (nếu chưa tồn tại)
    Task CreateCollectionAsync();
    
    /// Thêm documents vào collection
    Task UpsertAsync(List<DocumentChunk> chunks);
    
    /// Tìm kiếm documents với filter theo source_type
    Task<List<QdrantSearchResult>> SearchWithFilterAsync(float[] queryVector, string? sourceType, int topK = 5, double minScore = 0.0);
    
    /// Xóa tất cả documents trong collection
    Task ClearCollectionAsync();
    
    /// Kiểm tra collection có tồn tại không
    Task<bool> CollectionExistsAsync();
    
    /// Lấy số lượng documents trong collection
    Task<long> GetDocumentCountAsync();
    
    /// Kiểm tra Qdrant có đang chạy không
    Task<bool> IsHealthyAsync();
}

public class QdrantService : IQdrantService
{
    private readonly HttpClient _httpClient;
    private readonly RagConfiguration _config;
    private readonly ILogger<QdrantService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public QdrantService(
        HttpClient httpClient,
        RagConfiguration config,
        ILogger<QdrantService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        
        _httpClient.BaseAddress = new Uri(_config.QdrantBaseUrl);
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    public async Task CreateCollectionAsync()
    {
        try
        {
            // Check if collection already exists
            if (await CollectionExistsAsync())
            {
                _logger.LogInformation("Collection {Collection} already exists", _config.CollectionName);
                return;
            }

            // Create collection
            var createRequest = new
            {
                vectors = new
                {
                    size = _config.VectorSize,
                    distance = "Cosine"
                }
            };

            var json = JsonSerializer.Serialize(createRequest, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync(
                $"/collections/{_config.CollectionName}", 
                content);
            
            response.EnsureSuccessStatusCode();
            
            _logger.LogInformation("Created collection {Collection}", _config.CollectionName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Qdrant collection");
            throw;
        }
    }

    public async Task UpsertAsync(List<DocumentChunk> chunks)
    {
        try
        {
            if (!chunks.Any()) return;

            var points = chunks.Select(chunk => new
            {
                id = chunk.Id,
                vector = chunk.Embedding,
                payload = new Dictionary<string, object>
                {
                    ["content"] = chunk.Content,
                    ["source"] = chunk.Source,
                    ["source_type"] = chunk.SourceType,
                    ["created_at"] = chunk.CreatedAt.ToString("O"),
                    ["metadata"] = chunk.Metadata
                }
            }).ToList();

            var upsertRequest = new { points };
            var json = JsonSerializer.Serialize(upsertRequest, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync(
                $"/collections/{_config.CollectionName}/points", 
                content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Qdrant upsert failed: {StatusCode} - {Error}", 
                    response.StatusCode, errorBody);
                
                // Nếu lỗi do vector size không khớp, xóa collection và tạo lại
                if (errorBody.Contains("dimension") || errorBody.Contains("vector"))
                {
                    _logger.LogWarning("Vector dimension mismatch detected. Recreating collection...");
                    await ClearCollectionAsync();
                    await CreateCollectionAsync();
                    
                    // Retry upsert
                    content = new StringContent(json, Encoding.UTF8, "application/json");
                    response = await _httpClient.PutAsync(
                        $"/collections/{_config.CollectionName}/points", 
                        content);
                    response.EnsureSuccessStatusCode();
                }
                else
                {
                    response.EnsureSuccessStatusCode();
                }
            }
            
            _logger.LogInformation("Upserted {Count} documents to Qdrant", chunks.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting to Qdrant");
            throw;
        }
    }

    public async Task ClearCollectionAsync()
    {
        try
        {
            // Delete and recreate collection
            var response = await _httpClient.DeleteAsync(
                $"/collections/{_config.CollectionName}");
            
            if (response.IsSuccessStatusCode)
            {
                await CreateCollectionAsync();
                _logger.LogInformation("Cleared collection {Collection}", _config.CollectionName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing Qdrant collection");
            throw;
        }
    }

    /// <summary>
    /// Search với filter theo source_type (event, faq, etc.)
    /// </summary>
    public async Task<List<QdrantSearchResult>> SearchWithFilterAsync(
        float[] queryVector, 
        string? sourceType, 
        int topK = 5, 
        double minScore = 0.0)
    {
        try
        {
            if (!await CollectionExistsAsync())
            {
                _logger.LogWarning("Collection does not exist");
                return new List<QdrantSearchResult>();
            }

            object searchRequest;
            
            if (!string.IsNullOrEmpty(sourceType))
            {
                // Search với filter
                searchRequest = new
                {
                    vector = queryVector,
                    limit = topK,
                    with_payload = true,
                    score_threshold = minScore,
                    filter = new
                    {
                        must = new[]
                        {
                            new
                            {
                                key = "source_type",
                                match = new { value = sourceType }
                            }
                        }
                    }
                };
            }
            else
            {
                // Search không filter
                searchRequest = new
                {
                    vector = queryVector,
                    limit = topK,
                    with_payload = true,
                    score_threshold = minScore
                };
            }

            var json = JsonSerializer.Serialize(searchRequest, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"/collections/{_config.CollectionName}/points/search", 
                content);
            
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new List<QdrantSearchResult>();
            }
            
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<QdrantSearchResponse>(responseJson, _jsonOptions);

            return result?.Result?.Select(r => new QdrantSearchResult
            {
                Id = r.Id?.ToString() ?? "",
                Score = r.Score,
                Payload = r.Payload ?? new Dictionary<string, object>()
            }).ToList() ?? new List<QdrantSearchResult>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching Qdrant with filter");
            throw;
        }
    }

    public async Task<bool> CollectionExistsAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"/collections/{_config.CollectionName}");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<long> GetDocumentCountAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"/collections/{_config.CollectionName}");
            
            if (!response.IsSuccessStatusCode) return 0;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            if (doc.RootElement.TryGetProperty("result", out var result) &&
                result.TryGetProperty("points_count", out var count))
            {
                return count.GetInt64();
            }

            return 0;
        }
        catch
        {
            return 0;
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }
}

// Helper classes for Qdrant responses
internal class QdrantSearchResponse
{
    public List<QdrantSearchResultInternal>? Result { get; set; }
}

internal class QdrantSearchResultInternal
{
    public object? Id { get; set; }
    public double Score { get; set; }
    public Dictionary<string, object>? Payload { get; set; }
}
