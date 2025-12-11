using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Tickify.Server.AI.Models;

namespace Tickify.Server.AI.Services;

/// <summary>
/// Service for interacting with Qdrant Vector Database
/// Qdrant chạy local tại http://localhost:6333
/// </summary>
public interface IQdrantService
{
    /// <summary>
    /// Tạo collection mới (nếu chưa tồn tại)
    /// </summary>
    Task CreateCollectionAsync();
    
    /// <summary>
    /// Thêm documents vào collection
    /// </summary>
    Task UpsertAsync(List<DocumentChunk> chunks);
    
    /// <summary>
    /// Tìm kiếm documents tương tự
    /// </summary>
    Task<List<QdrantSearchResult>> SearchAsync(float[] queryVector, int topK = 5, double minScore = 0.7);
    
    /// <summary>
    /// Xóa tất cả documents trong collection
    /// </summary>
    Task ClearCollectionAsync();
    
    /// <summary>
    /// Kiểm tra collection có tồn tại không
    /// </summary>
    Task<bool> CollectionExistsAsync();
    
    /// <summary>
    /// Lấy số lượng documents trong collection
    /// </summary>
    Task<long> GetDocumentCountAsync();
    
    /// <summary>
    /// Kiểm tra Qdrant có đang chạy không
    /// </summary>
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

    public async Task<List<QdrantSearchResult>> SearchAsync(
        float[] queryVector, 
        int topK = 5, 
        double minScore = 0.7)
    {
        try
        {
            // Kiểm tra collection có tồn tại không, nếu chưa thì tạo mới
            if (!await CollectionExistsAsync())
            {
                _logger.LogWarning("Collection {CollectionName} does not exist. Creating...", _config.CollectionName);
                await CreateCollectionAsync();
                // Collection mới tạo nên chưa có data, trả về rỗng
                return new List<QdrantSearchResult>();
            }

            var searchRequest = new
            {
                vector = queryVector,
                limit = topK,
                with_payload = true,
                score_threshold = minScore
            };

            var json = JsonSerializer.Serialize(searchRequest, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"/collections/{_config.CollectionName}/points/search", 
                content);
            
            // Nếu 404 (collection không tồn tại), trả về list rỗng
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Collection not found during search, returning empty results");
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
        catch (HttpRequestException ex) when (ex.Message.Contains("404"))
        {
            _logger.LogWarning("Collection not found, returning empty results");
            return new List<QdrantSearchResult>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching Qdrant");
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
