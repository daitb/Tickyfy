using System.Text;
using System.Text.RegularExpressions;
using Tickify.Server.Models;

namespace Tickify.Server.Services.AI;

/// <summary>
/// Service xử lý documents: chunking, cleaning, processing
/// </summary>
public interface IDocumentProcessorService
{
    /// Chia text thành các chunks nhỏ
    List<DocumentChunk> ChunkText(string text, string source, string sourceType, Dictionary<string, object>? metadata = null);
    
    /// Làm sạch text
    string CleanText(string text);
}

public class DocumentProcessorService : IDocumentProcessorService
{
    private readonly RagConfiguration _config;
    private readonly ILogger<DocumentProcessorService> _logger;

    public DocumentProcessorService(
        RagConfiguration config,
        ILogger<DocumentProcessorService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public List<DocumentChunk> ChunkText(
        string text, 
        string source, 
        string sourceType, 
        Dictionary<string, object>? metadata = null)
    {
        var chunks = new List<DocumentChunk>();
        
        if (string.IsNullOrWhiteSpace(text)) return chunks;

        var cleanedText = CleanText(text);
        var sentences = SplitIntoSentences(cleanedText);
        
        var currentChunk = new StringBuilder();
        var chunkIndex = 0;

        foreach (var sentence in sentences)
        {
            // If adding this sentence would exceed chunk size, save current chunk
            if (currentChunk.Length + sentence.Length > _config.ChunkSize && currentChunk.Length > 0)
            {
                chunks.Add(CreateChunk(
                    currentChunk.ToString().Trim(),
                    source,
                    sourceType,
                    chunkIndex++,
                    metadata));

                // Start new chunk with overlap
                var overlap = GetOverlapText(currentChunk.ToString(), _config.ChunkOverlap);
                currentChunk.Clear();
                currentChunk.Append(overlap);
            }

            currentChunk.Append(sentence).Append(" ");
        }

        // Add final chunk
        if (currentChunk.Length > 0)
        {
            chunks.Add(CreateChunk(
                currentChunk.ToString().Trim(),
                source,
                sourceType,
                chunkIndex,
                metadata));
        }

        _logger.LogDebug("Split document {Source} into {Count} chunks", source, chunks.Count);
        return chunks;
    }

    public string CleanText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        // Remove excessive whitespace
        text = Regex.Replace(text, @"\s+", " ");
        
        // Remove special characters but keep Vietnamese characters
        text = Regex.Replace(text, @"[^\w\s\p{L}.,!?;:()\-""']", " ");
        
        // Trim
        text = text.Trim();

        return text;
    }

    private DocumentChunk CreateChunk(
        string content,
        string source,
        string sourceType,
        int index,
        Dictionary<string, object>? metadata)
    {
        // Qdrant yêu cầu ID phải là UUID hoặc unsigned integer
        return new DocumentChunk
        {
            Id = Guid.NewGuid().ToString(),
            Content = content,
            Source = source,
            SourceType = sourceType,
            Metadata = new Dictionary<string, object>(metadata ?? new Dictionary<string, object>())
            {
                ["chunk_index"] = index  // Lưu index vào metadata thay vì ID
            },
            CreatedAt = DateTime.UtcNow
        };
    }

    private List<string> SplitIntoSentences(string text)
    {
        // Split by sentence-ending punctuation
        var pattern = @"(?<=[.!?])\s+";
        var sentences = Regex.Split(text, pattern)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();
        
        return sentences;
    }

    private string GetOverlapText(string text, int overlapSize)
    {
        if (text.Length <= overlapSize) return text;
        
        // Get last N characters, but try to break at word boundary
        var overlap = text.Substring(text.Length - overlapSize);
        var wordBoundary = overlap.IndexOf(' ');
        
        if (wordBoundary > 0 && wordBoundary < overlap.Length - 10)
        {
            overlap = overlap.Substring(wordBoundary + 1);
        }
        
        return overlap;
    }
}
