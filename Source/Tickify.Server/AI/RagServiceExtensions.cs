using Tickify.Server.AI.Models;
using Tickify.Server.AI.Services;

namespace Tickify.Server.AI;

/// <summary>
/// Extension methods để đăng ký RAG services vào DI container
/// Hỗ trợ nhiều LLM providers: Groq (cloud free), Ollama (local)
/// </summary>
public static class RagServiceExtensions
{
    /// <summary>
    /// Đăng ký tất cả RAG services
    /// </summary>
    public static IServiceCollection AddRagServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Đọc cấu hình RAG từ appsettings.json
        var ragConfig = configuration.GetSection("Rag").Get<RagConfiguration>() 
            ?? new RagConfiguration();
        
        // Tự động chọn LLM provider dựa trên API key
        if (string.IsNullOrEmpty(ragConfig.LlmProvider))
        {
            ragConfig.LlmProvider = !string.IsNullOrEmpty(ragConfig.GroqApiKey) ? "groq" : "ollama";
        }
        
        // Tự động chọn Embedding provider
        if (string.IsNullOrEmpty(ragConfig.EmbeddingProvider))
        {
            if (!string.IsNullOrEmpty(ragConfig.GroqApiKey))
                ragConfig.EmbeddingProvider = "groq";
            else if (!string.IsNullOrEmpty(ragConfig.HuggingFaceApiKey))
                ragConfig.EmbeddingProvider = "huggingface";
            else
                ragConfig.EmbeddingProvider = "ollama";
        }
        
        // Đăng ký configuration như singleton
        services.AddSingleton(ragConfig);

        // Đăng ký HttpClient cho Groq (Cloud LLM - RECOMMENDED)
        if (!string.IsNullOrEmpty(ragConfig.GroqApiKey))
        {
            services.AddHttpClient<IGroqService, GroqService>(client =>
            {
                client.BaseAddress = new Uri("https://api.groq.com/openai/v1/");
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {ragConfig.GroqApiKey}");
                client.Timeout = TimeSpan.FromMinutes(2);
            });
        }

        // Đăng ký HttpClient cho Ollama (Local LLM - Optional fallback)
        services.AddHttpClient<IOllamaService, OllamaService>(client =>
        {
            client.BaseAddress = new Uri(ragConfig.OllamaBaseUrl);
            client.Timeout = TimeSpan.FromMinutes(5);
        });

        // Đăng ký HttpClient cho Qdrant (Vector Database)
        services.AddHttpClient<IQdrantService, QdrantService>(client =>
        {
            client.BaseAddress = new Uri(ragConfig.QdrantBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        // Đăng ký Embedding Service (multi-provider support)
        // Sử dụng HuggingFace API nếu có API key, ngược lại dùng simple local
        if (!string.IsNullOrEmpty(ragConfig.HuggingFaceApiKey))
        {
            services.AddHttpClient<IEmbeddingService, HuggingFaceEmbeddingService>(client =>
            {
                client.Timeout = TimeSpan.FromMinutes(2);
            });
        }
        else
        {
            services.AddSingleton<IEmbeddingService>(sp => 
                new SimpleEmbeddingService(
                    ragConfig, 
                    sp.GetRequiredService<ILogger<SimpleEmbeddingService>>()));
        }

        // Đăng ký các services khác
        services.AddScoped<IDocumentProcessorService, DocumentProcessorService>();
        services.AddScoped<IRagService, RagService>();

        return services;
    }
}
