using Microsoft.EntityFrameworkCore;
using Tickify.Data;

namespace Tickify.Server.AI.Services;

/// <summary>
/// Service chính xử lý RAG pipeline
/// Hỗ trợ nhiều LLM providers: Groq (cloud free), Ollama (local)
/// </summary>
public interface IRagService
{
    Task<Models.ChatResponse> ProcessQueryAsync(Models.ChatRequest request);
    IAsyncEnumerable<string> StreamQueryAsync(Models.ChatRequest request);
    Task IndexDocumentsAsync(List<Models.IndexDocumentRequest> documents);
    Task IndexEventsFromDatabaseAsync();
    Task IndexMarkdownFileAsync(string filePath);
    Task<RagStatus> GetStatusAsync();
}

public class RagStatus
{
    public bool LlmHealthy { get; set; }
    public bool QdrantHealthy { get; set; }
    public bool EmbeddingHealthy { get; set; }
    public long DocumentCount { get; set; }
    public string LlmProvider { get; set; } = string.Empty;
    public string EmbeddingProvider { get; set; } = string.Empty;
}

public class RagService : IRagService
{
    private readonly IGroqService? _groqService;
    private readonly IOllamaService? _ollamaService;
    private readonly IEmbeddingService _embeddingService;
    private readonly IQdrantService _qdrantService;
    private readonly IDocumentProcessorService _documentProcessor;
    private readonly ApplicationDbContext _dbContext;
    private readonly Models.RagConfiguration _config;
    private readonly ILogger<RagService> _logger;

    private const string SystemPrompt = """
        Ban la Tickify Assistant - tro ly AI thong minh cho he thong quan ly su kien Tickify.

        NHIEM VU CUA BAN:
        - Ho tro nguoi dung tim kiem va dat ve su kien
        - Tra loi cac cau hoi ve su kien, lich trinh, dia diem
        - Huong dan su dung cac tinh nang cua Tickify
        - Giai dap thac mac ve thanh toan, hoan tien, doi ve

        QUY TAC:
        1. Chi tra loi dua tren thong tin duoc cung cap trong CONTEXT
        2. Neu khong tim thay thong tin, hay noi ro "Toi khong co thong tin ve van de nay"
        3. Tra loi ngan gon, ro rang, than thien
        4. Su dung tieng Viet tru khi nguoi dung hoi bang tieng Anh
        5. Khong bia thong tin

        CONTEXT (Thong tin lien quan):
        {context}

        Hay tra loi cau hoi cua nguoi dung dua tren context tren.
        """;

    public RagService(
        IQdrantService qdrantService,
        IDocumentProcessorService documentProcessor,
        IEmbeddingService embeddingService,
        ApplicationDbContext dbContext,
        Models.RagConfiguration config,
        ILogger<RagService> logger,
        IGroqService? groqService = null,
        IOllamaService? ollamaService = null)
    {
        _qdrantService = qdrantService;
        _documentProcessor = documentProcessor;
        _embeddingService = embeddingService;
        _dbContext = dbContext;
        _config = config;
        _logger = logger;
        _groqService = groqService;
        _ollamaService = ollamaService;
    }

    private async Task<string> ChatWithLlmAsync(
        string systemPrompt, 
        string userMessage, 
        List<Models.ChatMessage>? history = null)
    {
        if (_config.LlmProvider == "groq" && _groqService != null)
        {
            return await _groqService.ChatAsync(systemPrompt, userMessage, history);
        }
        else if (_ollamaService != null)
        {
            return await _ollamaService.ChatAsync(systemPrompt, userMessage, history);
        }
        
        throw new InvalidOperationException("No LLM provider configured. Please set GroqApiKey or run Ollama.");
    }

    private IAsyncEnumerable<string> StreamChatWithLlmAsync(
        string systemPrompt, 
        string userMessage, 
        List<Models.ChatMessage>? history = null)
    {
        if (_config.LlmProvider == "groq" && _groqService != null)
        {
            return _groqService.StreamChatAsync(systemPrompt, userMessage, history);
        }
        else if (_ollamaService != null)
        {
            return _ollamaService.StreamChatAsync(systemPrompt, userMessage, history);
        }
        
        throw new InvalidOperationException("No LLM provider configured.");
    }

    public async Task<Models.ChatResponse> ProcessQueryAsync(Models.ChatRequest request)
    {
        var conversationId = request.ConversationId ?? Guid.NewGuid().ToString();
        
        try
        {
            _logger.LogInformation("Processing query: {Query}", request.Message);
            
            // 1. Create embedding for query
            var queryEmbedding = await _embeddingService.GetEmbeddingAsync(request.Message);

            // 2. Search for relevant documents
            var searchResults = await _qdrantService.SearchAsync(
                queryEmbedding, 
                _config.TopK, 
                _config.MinRelevanceScore);

            // 3. Build context
            var context = BuildContext(searchResults);
            var sources = ExtractSources(searchResults);

            // 4. Create prompt with context
            var promptWithContext = SystemPrompt.Replace("{context}", context);

            // 5. Get LLM response
            var response = await ChatWithLlmAsync(
                promptWithContext, 
                request.Message, 
                request.History);

            return new Models.ChatResponse
            {
                Message = response,
                ConversationId = conversationId,
                Sources = sources,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing RAG query");
            return new Models.ChatResponse
            {
                Message = "Xin loi, da co loi xay ra. Vui long thu lai sau.",
                ConversationId = conversationId,
                Success = false,
                Error = ex.Message
            };
        }
    }

    public async IAsyncEnumerable<string> StreamQueryAsync(Models.ChatRequest request)
    {
        var queryEmbedding = await _embeddingService.GetEmbeddingAsync(request.Message);

        var searchResults = await _qdrantService.SearchAsync(
            queryEmbedding, 
            _config.TopK, 
            _config.MinRelevanceScore);

        var context = BuildContext(searchResults);
        var promptWithContext = SystemPrompt.Replace("{context}", context);

        await foreach (var chunk in StreamChatWithLlmAsync(
            promptWithContext, 
            request.Message, 
            request.History))
        {
            yield return chunk;
        }
    }

    public async Task IndexDocumentsAsync(List<Models.IndexDocumentRequest> documents)
    {
        _logger.LogInformation("Indexing {Count} documents", documents.Count);

        await _qdrantService.CreateCollectionAsync();

        var allChunks = new List<Models.DocumentChunk>();

        foreach (var doc in documents)
        {
            var chunks = _documentProcessor.ChunkText(
                doc.Content, 
                doc.Source, 
                doc.SourceType, 
                doc.Metadata);
            
            allChunks.AddRange(chunks);
        }

        _logger.LogInformation("Creating embeddings for {Count} chunks", allChunks.Count);
        
        var batchSize = 10;
        for (var i = 0; i < allChunks.Count; i += batchSize)
        {
            var batch = allChunks.Skip(i).Take(batchSize).ToList();
            
            foreach (var chunk in batch)
            {
                chunk.Embedding = await _embeddingService.GetEmbeddingAsync(chunk.Content);
            }

            await _qdrantService.UpsertAsync(batch);
            
            _logger.LogInformation("Indexed batch {Batch}/{Total}", 
                i / batchSize + 1, 
                (allChunks.Count + batchSize - 1) / batchSize);
        }

        _logger.LogInformation("Finished indexing {Count} chunks", allChunks.Count);
    }

    public async Task IndexEventsFromDatabaseAsync()
    {
        _logger.LogInformation("Indexing events from database");

        var events = await _dbContext.Events
            .Include(e => e.Category)
            .Include(e => e.Organizer)
            .Where(e => e.Status == Tickify.Models.EventStatus.Published || 
                       e.Status == Tickify.Models.EventStatus.Approved)
            .ToListAsync();

        var documents = events.Select(e => new Models.IndexDocumentRequest
        {
            Content = BuildEventContent(e),
            Source = $"Event: {e.Title}",
            SourceType = "event",
            Metadata = new Dictionary<string, object>
            {
                ["event_id"] = e.Id,
                ["category"] = e.Category?.Name ?? "",
                ["start_date"] = e.StartDate.ToString("yyyy-MM-dd"),
                ["location"] = e.Location ?? ""
            }
        }).ToList();

        await IndexDocumentsAsync(documents);
    }

    public async Task IndexMarkdownFileAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            _logger.LogWarning("File not found: {FilePath}", filePath);
            return;
        }

        var content = await File.ReadAllTextAsync(filePath);
        var fileName = Path.GetFileName(filePath);
        
        var chunks = _documentProcessor.ProcessMarkdown(content, fileName);
        
        foreach (var chunk in chunks)
        {
            chunk.Embedding = await _embeddingService.GetEmbeddingAsync(chunk.Content);
        }

        await _qdrantService.CreateCollectionAsync();
        await _qdrantService.UpsertAsync(chunks);
        
        _logger.LogInformation("Indexed markdown file: {FileName} ({Count} chunks)", 
            fileName, chunks.Count);
    }

    public async Task<RagStatus> GetStatusAsync()
    {
        var llmHealthy = false;
        
        if (_config.LlmProvider == "groq" && _groqService != null)
        {
            llmHealthy = await _groqService.IsHealthyAsync();
        }
        else if (_ollamaService != null)
        {
            llmHealthy = await _ollamaService.IsHealthyAsync();
        }

        return new RagStatus
        {
            LlmHealthy = llmHealthy,
            QdrantHealthy = await _qdrantService.IsHealthyAsync(),
            EmbeddingHealthy = await _embeddingService.IsHealthyAsync(),
            DocumentCount = await _qdrantService.GetDocumentCountAsync(),
            LlmProvider = _config.LlmProvider,
            EmbeddingProvider = _config.EmbeddingProvider
        };
    }

    private string BuildContext(List<Models.QdrantSearchResult> results)
    {
        if (!results.Any())
        {
            return "Khong tim thay thong tin lien quan trong co so du lieu.";
        }

        var contextBuilder = new System.Text.StringBuilder();
        
        foreach (var result in results)
        {
            if (result.Payload.TryGetValue("content", out var content))
            {
                contextBuilder.AppendLine("---");
                contextBuilder.AppendLine($"Nguon: {result.Payload.GetValueOrDefault("source", "Unknown")}");
                contextBuilder.AppendLine($"Do lien quan: {result.Score:P0}");
                contextBuilder.AppendLine(content?.ToString() ?? "");
                contextBuilder.AppendLine();
            }
        }

        return contextBuilder.ToString();
    }

    private List<Models.SourceReference> ExtractSources(List<Models.QdrantSearchResult> results)
    {
        return results.Select(r => new Models.SourceReference
        {
            Source = r.Payload.GetValueOrDefault("source", "Unknown")?.ToString() ?? "",
            SourceType = r.Payload.GetValueOrDefault("source_type", "")?.ToString() ?? "",
            Title = r.Payload.GetValueOrDefault("source", "")?.ToString() ?? "",
            RelevanceScore = r.Score
        }).ToList();
    }

    private static string BuildEventContent(Tickify.Models.Event e)
    {
        return $"""
            Su kien: {e.Title}
            Mo ta: {e.Description}
            Thoi gian bat dau: {e.StartDate:dd/MM/yyyy HH:mm}
            Thoi gian ket thuc: {e.EndDate:dd/MM/yyyy HH:mm}
            Dia diem: {e.Location}
            Danh muc: {e.Category?.Name ?? "Chua phan loai"}
            To chuc boi: {e.Organizer?.CompanyName ?? "Khong ro"}
            Trang thai: {e.Status}
            """;
    }
}
