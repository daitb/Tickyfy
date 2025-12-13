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
    Task IndexFaqAsync();
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
        Bạn là Tickify Assistant - trợ lý AI thông minh cho hệ thống quản lý sự kiện Tickify.

        NHIỆM VỤ:
        - Hỗ trợ người dùng tìm kiếm và đặt vé sự kiện
        - Trả lời câu hỏi về sự kiện, lịch trình, địa điểm, giá vé
        - Hướng dẫn sử dụng các tính năng của Tickify
        - Giải đáp thắc mắc về thanh toán, hoàn tiền, đổi vé

        QUY TẮC BẮT BUỘC:
        1. LUÔN trả lời dựa trên thông tin trong CONTEXT bên dưới
        2. Nếu CONTEXT có thông tin về sự kiện, hãy liệt kê đầy đủ
        3. Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng, thân thiện
        4. Format danh sách sự kiện rõ ràng với tên, ngày, địa điểm
        5. Nếu người dùng hỏi về vấn đề không liên quan đến sự kiện (ví dụ: siêu thị, thời tiết, tin tức xã hội...), hãy từ chối lịch sự.
        6. TUYỆT ĐỐI KHÔNG khuyên người dùng tìm kiếm thông tin đó trên Tickify (vì Tickify chỉ có sự kiện).
        7. Hãy gợi ý lái sang các sự kiện có chủ đề tương tự (Ví dụ: Hỏi siêu thị -> Gợi ý Hội chợ; Hỏi ca sĩ -> Gợi ý Nhạc hội).
        8. Mẫu câu trả lời: "Xin lỗi, Tickify chỉ cung cấp thông tin sự kiện. Bạn có muốn tìm các [Sự kiện liên quan] không?"

        CONTEXT (Dữ liệu sự kiện từ Tickify):
        {context}

        Dựa trên CONTEXT trên, hãy trả lời câu hỏi của người dùng.
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
            _logger.LogInformation("Created embedding with {Dims} dimensions", queryEmbedding.Length);

            // 2. Search for relevant documents - dùng minScore thấp cho simple embedding
            var minScore = 0.0; // Không lọc theo score, lấy tất cả
            var searchResults = await _qdrantService.SearchAsync(
                queryEmbedding, 
                _config.TopK, 
                minScore);

            _logger.LogInformation("Found {Count} relevant documents from Qdrant", searchResults.Count);
            foreach (var r in searchResults)
            {
                _logger.LogInformation("  - Score: {Score:F4}, Source: {Source}", 
                    r.Score, r.Payload.GetValueOrDefault("source", "unknown"));
            }

            // 3. Build context
            var context = BuildContext(searchResults);
            var sources = ExtractSources(searchResults);
            
            _logger.LogInformation("Built context: {ContextPreview}...", 
                context.Length > 200 ? context[..200] : context);

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
        _logger.LogInformation("StreamQuery: Processing query '{Query}'", request.Message);
        
        var queryEmbedding = await _embeddingService.GetEmbeddingAsync(request.Message);
        _logger.LogInformation("StreamQuery: Created embedding with {Dims} dimensions", queryEmbedding.Length);

        // Dùng minScore = 0 để lấy tất cả documents (không lọc)
        var minScore = 0.0;
        var searchResults = await _qdrantService.SearchAsync(
            queryEmbedding, 
            _config.TopK, 
            minScore);

        _logger.LogInformation("StreamQuery: Found {Count} relevant documents", searchResults.Count);
        
        foreach (var result in searchResults)
        {
            _logger.LogInformation("StreamQuery: Doc score={Score:F4}, source={Source}", 
                result.Score, result.Payload.GetValueOrDefault("source", "unknown"));
        }

        var context = BuildContext(searchResults);
        _logger.LogInformation("StreamQuery: Context length = {Len} chars", context.Length);
        
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
        
        _logger.LogInformation("Indexed {Count} events from database", events.Count);
    }

    /// <summary>
    /// Index FAQ từ file markdown
    /// </summary>
    public async Task IndexFaqAsync()
    {
        _logger.LogInformation("Indexing FAQ");

        // Đường dẫn đến file FAQ
        var faqPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "AI", "Data", "FAQ.md");
        
        // Fallback nếu chạy từ bin folder
        if (!File.Exists(faqPath))
        {
            faqPath = Path.Combine(AppContext.BaseDirectory, "AI", "Data", "FAQ.md");
        }
        
        // Fallback cho development
        if (!File.Exists(faqPath))
        {
            var projectRoot = Directory.GetCurrentDirectory();
            faqPath = Path.Combine(projectRoot, "AI", "Data", "FAQ.md");
        }

        if (!File.Exists(faqPath))
        {
            _logger.LogWarning("FAQ.md not found at expected paths");
            return;
        }

        var content = await File.ReadAllTextAsync(faqPath);
        
        // Parse FAQ sections
        var faqDocuments = ParseFaqContent(content);
        
        await IndexDocumentsAsync(faqDocuments);
        
        _logger.LogInformation("Indexed {Count} FAQ entries", faqDocuments.Count);
    }

    /// <summary>
    /// Parse nội dung FAQ markdown thành các documents
    /// </summary>
    private List<Models.IndexDocumentRequest> ParseFaqContent(string content)
    {
        var documents = new List<Models.IndexDocumentRequest>();
        var lines = content.Split('\n');
        
        string? currentCategory = null;
        string? currentQuestion = null;
        var currentAnswer = new System.Text.StringBuilder();

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            
            // Category header (## ...)
            if (trimmedLine.StartsWith("## "))
            {
                // Save previous Q&A if exists
                if (currentQuestion != null && currentAnswer.Length > 0)
                {
                    documents.Add(CreateFaqDocument(currentCategory, currentQuestion, currentAnswer.ToString()));
                }
                
                currentCategory = trimmedLine[3..].Trim();
                currentQuestion = null;
                currentAnswer.Clear();
            }
            // Question header (### ...)
            else if (trimmedLine.StartsWith("### "))
            {
                // Save previous Q&A if exists
                if (currentQuestion != null && currentAnswer.Length > 0)
                {
                    documents.Add(CreateFaqDocument(currentCategory, currentQuestion, currentAnswer.ToString()));
                }
                
                currentQuestion = trimmedLine[4..].Trim();
                currentAnswer.Clear();
            }
            // Answer content
            else if (currentQuestion != null && !string.IsNullOrWhiteSpace(trimmedLine))
            {
                currentAnswer.AppendLine(trimmedLine);
            }
        }

        // Don't forget the last Q&A
        if (currentQuestion != null && currentAnswer.Length > 0)
        {
            documents.Add(CreateFaqDocument(currentCategory, currentQuestion, currentAnswer.ToString()));
        }

        return documents;
    }

    private static Models.IndexDocumentRequest CreateFaqDocument(
        string? category, 
        string question, 
        string answer)
    {
        return new Models.IndexDocumentRequest
        {
            Content = $"""
                ❓ CÂU HỎI: {question}
                
                📂 Danh mục: {category ?? "FAQ"}
                
                ✅ TRẢ LỜI:
                {answer.Trim()}
                """,
            Source = $"FAQ: {question}",
            SourceType = "faq",
            Metadata = new Dictionary<string, object>
            {
                ["category"] = category ?? "General",
                ["question"] = question,
                ["type"] = "faq"
            }
        };
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
        var statusText = e.Status switch
        {
            Tickify.Models.EventStatus.Published => "Đang mở bán",
            Tickify.Models.EventStatus.Approved => "Đã duyệt",
            Tickify.Models.EventStatus.Pending => "Chờ duyệt",
            Tickify.Models.EventStatus.Rejected => "Đã từ chối",
            Tickify.Models.EventStatus.Cancelled => "Đã hủy",
            Tickify.Models.EventStatus.Completed => "Đã kết thúc",
            _ => e.Status.ToString()
        };

        return $"""
            🎫 SỰ KIỆN: {e.Title}
            
            📝 Mô tả: {e.Description}
            
            📅 Thời gian: {e.StartDate:dd/MM/yyyy HH:mm} - {e.EndDate:dd/MM/yyyy HH:mm}
            
            📍 Địa điểm: {e.Location}
            {(string.IsNullOrEmpty(e.Address) ? "" : $"📌 Địa chỉ: {e.Address}")}
            
            🏷️ Danh mục: {e.Category?.Name ?? "Chưa phân loại"}
            
            🏢 Tổ chức bởi: {e.Organizer?.CompanyName ?? "Không rõ"}
            
            ✅ Trạng thái: {statusText}
            
            👥 Sức chứa tối đa: {e.MaxCapacity} người
            """;
    }
}
