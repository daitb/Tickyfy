namespace Tickify.Server.Models;

public class DocumentChunk
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Content { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty; // "event", "faq", "document", "api"
    public Dictionary<string, object> Metadata { get; set; } = new();
    public float[] Embedding { get; set; } = Array.Empty<float>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ChatMessage
{
    public string Role { get; set; } = "user"; // "user", "assistant", "system"
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
    public List<ChatMessage>? History { get; set; }
    public string? UserId { get; set; }
}

public class ChatResponse
{
    public string Message { get; set; } = string.Empty;
    public string ConversationId { get; set; } = string.Empty;
    public List<SourceReference> Sources { get; set; } = new();
    public bool Success { get; set; } = true;
    public string? Error { get; set; }
}
public class SourceReference
{
    public string Title { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public double RelevanceScore { get; set; }
}

public class QdrantPoint
{
    public string Id { get; set; } = string.Empty;
    public float[] Vector { get; set; } = Array.Empty<float>();
    public Dictionary<string, object> Payload { get; set; } = new();
}

public class QdrantSearchResult
{
    public string Id { get; set; } = string.Empty;
    public double Score { get; set; }
    public Dictionary<string, object> Payload { get; set; } = new();
}

public class OllamaChatRequest
{
    public string Model { get; set; } = "llama3.2";
    public List<OllamaMessage> Messages { get; set; } = new();
    public bool Stream { get; set; } = false;
    public OllamaOptions? Options { get; set; }
}

public class OllamaMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class OllamaOptions
{
    public int NumCtx { get; set; } = 4096;
    public double Temperature { get; set; } = 0.7;
    public int NumPredict { get; set; } = 1024;
}

public class OllamaEmbedRequest
{
    public string Model { get; set; } = "nomic-embed-text";
    public string Prompt { get; set; } = string.Empty;
}
public class OllamaEmbedResponse
{
    public float[] Embedding { get; set; } = Array.Empty<float>();
}

public class OllamaChatResponse
{
    public string Model { get; set; } = string.Empty;
    public OllamaMessage Message { get; set; } = new();
    public bool Done { get; set; }
}

public class IndexDocumentRequest
{
    public string Content { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public Dictionary<string, object>? Metadata { get; set; }
}


public class BatchIndexRequest
{
    public List<IndexDocumentRequest> Documents { get; set; } = new();
}

public class RagConfiguration
{
    public string GroqApiKey { get; set; } = string.Empty;
    public string GroqModel { get; set; } = "llama-3.3-70b-versatile";
    public string JinaApiKey { get; set; } = string.Empty;
    
    // Qdrant settings
    public string QdrantBaseUrl { get; set; } = "http://localhost:6333";
    public string CollectionName { get; set; } = "tickify_documents";
    public int VectorSize { get; set; } = 1024;
    
    // RAG settings
    public int TopK { get; set; } = 5;
    public int ChunkSize { get; set; } = 500;
    public int ChunkOverlap { get; set; } = 50;
    public double MinRelevanceScore { get; set; } = 0.5;
}
