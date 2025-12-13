using Tickify.Server.Models;
using Tickify.Server.Services.AI;

namespace Tickify.Server.Extensions;

/// <summary>
/// Extension methods để đăng ký RAG services vào DI container
/// Sử dụng Groq API cho LLM
/// </summary>
public static class RagServiceExtensions
{
    public static IServiceCollection AddRagServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Đọc cấu hình RAG từ appsettings.json
        var ragConfig = configuration.GetSection("Rag").Get<RagConfiguration>() 
            ?? new RagConfiguration();
        
        // Đăng ký configuration như singleton
        services.AddSingleton(ragConfig);

        // Đăng ký HttpClient cho Groq (Cloud LLM)
        if (!string.IsNullOrEmpty(ragConfig.GroqApiKey))
        {
            services.AddHttpClient<IGroqService, GroqService>(client =>
            {
                client.BaseAddress = new Uri("https://api.groq.com/openai/v1/");
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {ragConfig.GroqApiKey}");
                client.Timeout = TimeSpan.FromMinutes(2);
            });
        }

        // Đăng ký HttpClient cho Qdrant (Vector Database)
        services.AddHttpClient<IQdrantService, QdrantService>(client =>
        {
            client.BaseAddress = new Uri(ragConfig.QdrantBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        // Đăng ký Jina Embedding Service
        services.AddHttpClient<IEmbeddingService, JinaEmbeddingService>(client =>
        {
            client.Timeout = TimeSpan.FromMinutes(2);
        });

        // Đăng ký các services khác
        services.AddScoped<IDocumentProcessorService, DocumentProcessorService>();
        
        // Đăng ký RagService với factory để xử lý optional dependencies
        services.AddScoped<IRagService>(sp =>
        {
            var qdrantService = sp.GetRequiredService<IQdrantService>();
            var documentProcessor = sp.GetRequiredService<IDocumentProcessorService>();
            var embeddingService = sp.GetRequiredService<IEmbeddingService>();
            var dbContext = sp.GetRequiredService<Tickify.Data.ApplicationDbContext>();
            var config = sp.GetRequiredService<RagConfiguration>();
            var logger = sp.GetRequiredService<ILogger<RagService>>();
            
            // Get optional services - returns null if not registered
            var groqService = sp.GetService<IGroqService>();
            
            return new RagService(
                qdrantService,
                documentProcessor,
                embeddingService,
                dbContext,
                config,
                logger,
                groqService);
        });

        return services;
    }
}
