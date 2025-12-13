namespace Tickify.Server.AI.Models;

/// <summary>
/// Represents a document chunk for RAG processing
/// </summary>
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

/// <summary>
/// Chat message model
/// </summary>
public class ChatMessage
{
    public string Role { get; set; } = "user"; // "user", "assistant", "system"
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Chat request from frontend
/// </summary>
public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
    public List<ChatMessage>? History { get; set; }
    public string? UserId { get; set; }
}

/// <summary>
/// Chat response to frontend
/// </summary>
public class ChatResponse
{
    public string Message { get; set; } = string.Empty;
    public string ConversationId { get; set; } = string.Empty;
    public List<SourceReference> Sources { get; set; } = new();
    public bool Success { get; set; } = true;
    public string? Error { get; set; }
}

/// <summary>
/// Source reference for citations
/// </summary>
public class SourceReference
{
    public string Title { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public double RelevanceScore { get; set; }
}

/// <summary>
/// Qdrant point model for vector storage
/// </summary>
public class QdrantPoint
{
    public string Id { get; set; } = string.Empty;
    public float[] Vector { get; set; } = Array.Empty<float>();
    public Dictionary<string, object> Payload { get; set; } = new();
}

/// <summary>
/// Qdrant search result
/// </summary>
public class QdrantSearchResult
{
    public string Id { get; set; } = string.Empty;
    public double Score { get; set; }
    public Dictionary<string, object> Payload { get; set; } = new();
}

/// <summary>
/// Ollama chat request model
/// </summary>
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

/// <summary>
/// Ollama embedding request
/// </summary>
public class OllamaEmbedRequest
{
    public string Model { get; set; } = "nomic-embed-text";
    public string Prompt { get; set; } = string.Empty;
}

/// <summary>
/// Ollama embedding response
/// </summary>
public class OllamaEmbedResponse
{
    public float[] Embedding { get; set; } = Array.Empty<float>();
}

/// <summary>
/// Ollama chat response
/// </summary>
public class OllamaChatResponse
{
    public string Model { get; set; } = string.Empty;
    public OllamaMessage Message { get; set; } = new();
    public bool Done { get; set; }
}

/// <summary>
/// Document indexing request
/// </summary>
public class IndexDocumentRequest
{
    public string Content { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Batch indexing request
/// </summary>
public class BatchIndexRequest
{
    public List<IndexDocumentRequest> Documents { get; set; } = new();
}

/// <summary>
/// RAG configuration
/// </summary>
public class RagConfiguration
{
    // Legacy Ollama settings (optional - can be removed if not using)
    public string OllamaBaseUrl { get; set; } = "http://localhost:11434";
    public string LlmModel { get; set; } = "llama3.2";
    public string EmbeddingModel { get; set; } = "nomic-embed-text";
    
    // Groq API (FREE - Recommended for LLM)
    public string GroqApiKey { get; set; } = string.Empty;
    public string GroqModel { get; set; } = "llama-3.3-70b-versatile"; // Best quality, free
    
    // Jina AI Embeddings API (FREE - 1M tokens/month)
    // Get key at: https://jina.ai/embeddings/
    public string JinaApiKey { get; set; } = string.Empty;
    
    // HuggingFace API (DEPRECATED - no longer supported)
    public string HuggingFaceApiKey { get; set; } = string.Empty;
    
    // LLM Provider: "groq", "ollama"
    public string LlmProvider { get; set; } = "groq";
    
    // Embedding Provider: "jina", "simple", "ollama"
    public string EmbeddingProvider { get; set; } = "jina";
    
    // Qdrant settings
    public string QdrantBaseUrl { get; set; } = "http://localhost:6333";
    public string CollectionName { get; set; } = "tickify_documents";
    public int VectorSize { get; set; } = 1024; // Jina embeddings-v3 dimension
    
    // RAG settings
    public int TopK { get; set; } = 5;
    public int ChunkSize { get; set; } = 500;
    public int ChunkOverlap { get; set; } = 50;
    public double MinRelevanceScore { get; set; } = 0.5;
}
