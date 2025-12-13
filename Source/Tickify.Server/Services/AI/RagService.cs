using Microsoft.EntityFrameworkCore;
using Tickify.Data;
using Tickify.Server.Models;

namespace Tickify.Server.Services.AI;

public interface IRagService
{
    Task<ChatResponse> ProcessQueryAsync(ChatRequest request);
    IAsyncEnumerable<string> StreamQueryAsync(ChatRequest request);
    Task IndexDocumentsAsync(List<IndexDocumentRequest> documents);
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
}

public class RagService : IRagService
{
    private readonly IGroqService? _groqService;
    private readonly IEmbeddingService _embeddingService;
    private readonly IQdrantService _qdrantService;
    private readonly IDocumentProcessorService _documentProcessor;
    private readonly ApplicationDbContext _dbContext;
    private readonly RagConfiguration _config;
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
        7. Mẫu câu trả lời: "Xin lỗi, Tickify chỉ cung cấp thông tin sự kiện. Bạn có muốn tìm các [Sự kiện liên quan] không?"

        CONTEXT (Dữ liệu sự kiện từ Tickify):
        {context}

        Dựa trên CONTEXT trên, hãy trả lời câu hỏi của người dùng.
        """;

    public RagService(
        IQdrantService qdrantService,
        IDocumentProcessorService documentProcessor,
        IEmbeddingService embeddingService,
        ApplicationDbContext dbContext,
        RagConfiguration config,
        ILogger<RagService> logger,
        IGroqService? groqService = null)
    {
        _qdrantService = qdrantService;
        _documentProcessor = documentProcessor;
        _embeddingService = embeddingService;
        _dbContext = dbContext;
        _config = config;
        _logger = logger;
        _groqService = groqService;
    }

    private async Task<string> ChatWithLlmAsync(
        string systemPrompt, 
        string userMessage, 
        List<ChatMessage>? history = null)
    {
        if (_groqService != null)
        {
            return await _groqService.ChatAsync(systemPrompt, userMessage, history);
        }
        
        throw new InvalidOperationException("No LLM provider configured. Please set GroqApiKey.");
    }

    private IAsyncEnumerable<string> StreamChatWithLlmAsync(
        string systemPrompt, 
        string userMessage, 
        List<ChatMessage>? history = null)
    {
        if (_groqService != null)
        {
            return _groqService.StreamChatAsync(systemPrompt, userMessage, history);
        }
        
        throw new InvalidOperationException("No LLM provider configured.");
    }

    public async Task<ChatResponse> ProcessQueryAsync(ChatRequest request)
    {
        var conversationId = request.ConversationId ?? Guid.NewGuid().ToString();
        
        try
        {
            _logger.LogInformation("Processing query: {Query}", request.Message);
            
            // 1. Create embedding for query
            var queryEmbedding = await _embeddingService.GetEmbeddingAsync(request.Message);
            _logger.LogInformation("Created embedding with {Dims} dimensions", queryEmbedding.Length);

            // 2. Phân loại câu hỏi và search thông minh
            var searchResults = await SmartSearchAsync(queryEmbedding, request.Message);

            _logger.LogInformation("Found {Count} relevant documents from Qdrant", searchResults.Count);
            foreach (var r in searchResults)
            {
                _logger.LogInformation("  - Score: {Score:F4}, Type: {Type}, Source: {Source}", 
                    r.Score, 
                    r.Payload.GetValueOrDefault("source_type", "unknown"),
                    r.Payload.GetValueOrDefault("source", "unknown"));
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

            return new ChatResponse
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
            return new ChatResponse
            {
                Message = "Xin loi, da co loi xay ra. Vui long thu lai sau.",
                ConversationId = conversationId,
                Success = false,
                Error = ex.Message
            };
        }
    }

    public async IAsyncEnumerable<string> StreamQueryAsync(ChatRequest request)
    {
        _logger.LogInformation("StreamQuery: Processing query '{Query}'", request.Message);
        
        var queryEmbedding = await _embeddingService.GetEmbeddingAsync(request.Message);
        _logger.LogInformation("StreamQuery: Created embedding with {Dims} dimensions", queryEmbedding.Length);

        // Sử dụng SmartSearch để lấy kết quả phù hợp
        var searchResults = await SmartSearchAsync(queryEmbedding, request.Message);

        _logger.LogInformation("StreamQuery: Found {Count} relevant documents", searchResults.Count);
        
        foreach (var result in searchResults)
        {
            _logger.LogInformation("StreamQuery: Doc score={Score:F4}, type={Type}, source={Source}", 
                result.Score, 
                result.Payload.GetValueOrDefault("source_type", "unknown"),
                result.Payload.GetValueOrDefault("source", "unknown"));
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

    /// <summary>
    /// Smart search - phân loại câu hỏi và search với filter phù hợp
    /// Nếu hỏi về sự kiện -> ưu tiên events
    /// Nếu hỏi về cách sử dụng/hướng dẫn -> ưu tiên FAQ
    /// Nếu không rõ -> lấy cả hai
    /// </summary>
    private async Task<List<QdrantSearchResult>> SmartSearchAsync(float[] queryEmbedding, string query)
    {
        var queryLower = query.ToLowerInvariant();
        
        // Keywords cho event queries
        var eventKeywords = new[] { 
            "sự kiện", "event", "concert", "show", "lịch", "ngày", "địa điểm", 
            "vé", "ticket", "giá", "danh sách", "tìm", "có những", "nào", 
            "đang diễn ra", "sắp tới", "hôm nay", "tuần này", "tháng này",
            "nhạc hội", "festival", "workshop", "hội thảo", "biểu diễn"
        };
        
        // Keywords cho FAQ queries  
        var faqKeywords = new[] { 
            "làm sao", "làm thế nào", "cách", "hướng dẫn", "thế nào", 
            "tại sao", "bao lâu", "ở đâu", "liên hệ", "hỗ trợ", "hotline",
            "hoàn tiền", "đổi vé", "hủy", "thanh toán", "payment", 
            "đăng ký", "đăng nhập", "tài khoản", "mật khẩu", "email",
            "quy định", "chính sách", "điều khoản"
        };
        
        var isEventQuery = eventKeywords.Any(k => queryLower.Contains(k));
        var isFaqQuery = faqKeywords.Any(k => queryLower.Contains(k));
        
        _logger.LogInformation("Query classification: isEvent={IsEvent}, isFaq={IsFaq}", isEventQuery, isFaqQuery);
        
        List<QdrantSearchResult> results;
        
        if (isEventQuery && !isFaqQuery)
        {
            // Chỉ hỏi về events -> lấy nhiều events
            _logger.LogInformation("Searching for events only");
            results = await _qdrantService.SearchWithFilterAsync(queryEmbedding, "event", _config.TopK, 0.0);
        }
        else if (isFaqQuery && !isEventQuery)
        {
            // Chỉ hỏi FAQ -> lấy FAQ + vài events liên quan
            _logger.LogInformation("Searching for FAQ with some events");
            var faqResults = await _qdrantService.SearchWithFilterAsync(queryEmbedding, "faq", _config.TopK - 2, 0.0);
            var eventResults = await _qdrantService.SearchWithFilterAsync(queryEmbedding, "event", 2, 0.0);
            results = faqResults.Concat(eventResults).ToList();
        }
        else
        {
            // Cả hai hoặc không rõ -> lấy cân bằng (ưu tiên events nhiều hơn)
            _logger.LogInformation("Searching for both events and FAQ");
            var eventResults = await _qdrantService.SearchWithFilterAsync(queryEmbedding, "event", _config.TopK - 3, 0.0);
            var faqResults = await _qdrantService.SearchWithFilterAsync(queryEmbedding, "faq", 3, 0.0);
            results = eventResults.Concat(faqResults).ToList();
        }
        
        // Sort by score descending
        return results.OrderByDescending(r => r.Score).ToList();
    }

    public async Task IndexDocumentsAsync(List<IndexDocumentRequest> documents)
    {
        _logger.LogInformation("Indexing {Count} documents", documents.Count);

        await _qdrantService.CreateCollectionAsync();

        var allChunks = new List<DocumentChunk>();

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

        var documents = events.Select(e => new IndexDocumentRequest
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

    public async Task IndexFaqAsync()
    {

        // Đường dẫn đến file FAQ
        var faqPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "FAQ.md");
        
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

    private List<IndexDocumentRequest> ParseFaqContent(string content)
    {
        var documents = new List<IndexDocumentRequest>();
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

    private static IndexDocumentRequest CreateFaqDocument(
        string? category, 
        string question, 
        string answer)
    {
        return new IndexDocumentRequest
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
        var llmHealthy = _groqService != null && await _groqService.IsHealthyAsync();

        return new RagStatus
        {
            LlmHealthy = llmHealthy,
            QdrantHealthy = await _qdrantService.IsHealthyAsync(),
            EmbeddingHealthy = await _embeddingService.IsHealthyAsync(),
            DocumentCount = await _qdrantService.GetDocumentCountAsync()
        };
    }

    private string BuildContext(List<QdrantSearchResult> results)
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

    private List<SourceReference> ExtractSources(List<QdrantSearchResult> results)
    {
        return results.Select(r => new SourceReference
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
