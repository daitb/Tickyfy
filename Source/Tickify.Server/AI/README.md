# 🤖 Tickify AI Chatbot - RAG Implementation Guide

## Mục lục
1. [Giới thiệu](#1-giới-thiệu)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Cài đặt môi trường](#3-cài-đặt-môi-trường)
4. [Cấu trúc code](#4-cấu-trúc-code)
5. [Hướng dẫn sử dụng](#5-hướng-dẫn-sử-dụng)
6. [API Reference](#6-api-reference)
7. [Ví dụ Conversation](#7-ví-dụ-conversation)
8. [Performance Optimization](#8-performance-optimization)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Giới thiệu

### RAG là gì?

**RAG (Retrieval-Augmented Generation)** là một kiến trúc AI kết hợp:
- **Retrieval**: Tìm kiếm thông tin liên quan từ cơ sở dữ liệu
- **Augmented**: Bổ sung context vào prompt
- **Generation**: Sinh câu trả lời dựa trên context

### Lợi ích của RAG cho Tickify:
- ✅ Trả lời chính xác về sự kiện, vé, thanh toán
- ✅ Cập nhật realtime khi có sự kiện mới
- ✅ Giảm hallucination (bịa thông tin)
- ✅ Chạy hoàn toàn local, miễn phí

---

## 2. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TICKIFY RAG ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   USER       │
                              │   (React)    │
                              └──────┬───────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                   │
│                                                                            │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       │
│   │ ChatbotWidget   │───▶│ useChatbot Hook │───▶│ chatbotService  │       │
│   │ (UI Component)  │    │ (State Logic)   │    │ (API Client)    │       │
│   └─────────────────┘    └─────────────────┘    └────────┬────────┘       │
│                                                          │                 │
└──────────────────────────────────────────────────────────┼─────────────────┘
                                                           │
                                                    HTTP POST
                                                    /api/chatbot/chat
                                                           │
┌──────────────────────────────────────────────────────────┼─────────────────┐
│                            BACKEND LAYER (.NET 9)        │                 │
│                                                          ▼                 │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       │
│   │ ChatbotController│◀───│   RagService    │◀───│ DocumentProcessor│      │
│   │ (API Endpoint)  │    │ (Main Pipeline) │    │ (Chunking)      │       │
│   └─────────────────┘    └────────┬────────┘    └─────────────────┘       │
│                                   │                                        │
│                    ┌──────────────┼──────────────┐                        │
│                    ▼              ▼              ▼                        │
│          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│          │OllamaService │ │QdrantService │ │DbContext     │              │
│          │(LLM + Embed) │ │(Vector Store)│ │(SQL Server)  │              │
│          └──────┬───────┘ └──────┬───────┘ └──────────────┘              │
│                 │                │                                        │
└─────────────────┼────────────────┼────────────────────────────────────────┘
                  │                │
┌─────────────────┼────────────────┼────────────────────────────────────────┐
│                 ▼                ▼                AI LAYER (LOCAL)        │
│        ┌──────────────┐  ┌──────────────┐                                 │
│        │   OLLAMA     │  │   QDRANT     │                                 │
│        │  LLM Server  │  │ Vector Store │                                 │
│        │              │  │              │                                 │
│        │ ┌──────────┐ │  │ Collection:  │                                 │
│        │ │ Llama3.2 │ │  │ tickify_docs │                                 │
│        │ └──────────┘ │  │              │                                 │
│        │ ┌──────────┐ │  │ ┌──────────┐ │                                 │
│        │ │ nomic-   │ │  │ │ Vectors  │ │                                 │
│        │ │embed-text│ │  │ │ 768 dims │ │                                 │
│        │ └──────────┘ │  │ └──────────┘ │                                 │
│        │              │  │              │                                 │
│        │ Port: 11434  │  │ Port: 6333   │                                 │
│        └──────────────┘  └──────────────┘                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

### Luồng xử lý Query

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QUERY PROCESSING FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

  User Question                                                     Response
       │                                                                ▲
       ▼                                                                │
┌──────────────┐                                                 ┌──────────────┐
│ 1. Receive   │                                                 │ 6. Stream    │
│    Query     │                                                 │    Response  │
└──────┬───────┘                                                 └──────┬───────┘
       │                                                                ▲
       ▼                                                                │
┌──────────────┐     Ollama API                                  ┌──────────────┐
│ 2. Create    │────────────────────┐                            │ 5. Generate  │
│    Embedding │                    │                            │    Answer    │
└──────┬───────┘                    │                            └──────┬───────┘
       │                            │                                   ▲
       │ 768-dim vector             │                                   │
       ▼                            │                                   │
┌──────────────┐                    │                            ┌──────────────┐
│ 3. Search    │                    │     ┌──────────────────┐   │ 4. Build     │
│    Qdrant    │                    └────▶│  Ollama LLM      │──▶│    Prompt    │
└──────┬───────┘                          │  (Llama 3.2)     │   └──────┬───────┘
       │                                  └──────────────────┘          ▲
       │ Top K similar docs                                             │
       ▼                                                                │
┌──────────────┐                                                        │
│ Relevant     │────────────────────────────────────────────────────────┘
│ Contexts     │                    Context injected into prompt
└──────────────┘
```

---

## 3. Cài đặt môi trường

### 3.1 Cài đặt Ollama (LLM Server)

```powershell
# 1. Tải Ollama từ: https://ollama.com/download

# 2. Sau khi cài đặt, mở PowerShell và chạy:
ollama pull llama3.2       # Model LLM chính (~2GB)
ollama pull nomic-embed-text  # Model embedding (~270MB)

# 3. Kiểm tra Ollama đang chạy:
ollama list
# Output: 
# NAME                ID              SIZE      
# llama3.2:latest     ...             2.0 GB    
# nomic-embed-text    ...             274 MB    

# 4. Test API:
Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
```

### 3.2 Cài đặt Qdrant (Vector Database)

**Cách 1: Tải Binary (Khuyến nghị)**
```powershell
# 1. Tải từ: https://github.com/qdrant/qdrant/releases
# Chọn file: qdrant-x86_64-pc-windows-msvc.zip

# 2. Giải nén và chạy:
.\qdrant.exe

# Qdrant sẽ chạy tại: http://localhost:6333
# Dashboard: http://localhost:6333/dashboard
```

**Cách 2: Dùng Qdrant Cloud (Free Tier)**
```
1. Đăng ký tại: https://cloud.qdrant.io/
2. Tạo cluster miễn phí (1GB storage)
3. Cập nhật QdrantBaseUrl trong appsettings.json
```

### 3.3 Cấu hình .NET Backend

```json
// appsettings.json
{
  "Rag": {
    "OllamaBaseUrl": "http://localhost:11434",
    "QdrantBaseUrl": "http://localhost:6333",
    "LlmModel": "llama3.2",
    "EmbeddingModel": "nomic-embed-text",
    "CollectionName": "tickify_documents",
    "VectorSize": 768,
    "TopK": 5,
    "ChunkSize": 500,
    "ChunkOverlap": 50,
    "MinRelevanceScore": 0.7
  }
}
```

---

## 4. Cấu trúc code

### Backend (.NET)

```
Tickify.Server/
└── AI/
    ├── Controllers/
    │   └── ChatbotController.cs    # API endpoints
    ├── Models/
    │   └── RagModels.cs            # DTOs và models
    ├── Services/
    │   ├── OllamaService.cs        # Giao tiếp với Ollama
    │   ├── QdrantService.cs        # Giao tiếp với Qdrant
    │   ├── DocumentProcessorService.cs  # Chunking documents
    │   └── RagService.cs           # Main RAG pipeline
    └── RagServiceExtensions.cs     # DI registration
```

### Frontend (React)

```
tickify.client/src/
├── components/
│   └── chatbot/
│       ├── ChatbotWidget.tsx       # UI Component
│       └── index.ts
├── hooks/
│   └── useChatbot.ts               # Chat state management
├── services/
│   └── chatbotService.ts           # API client
└── types/
    └── chatbot.ts                  # TypeScript types
```

---

## 5. Hướng dẫn sử dụng

### 5.1 Khởi động hệ thống

```powershell
# Terminal 1: Chạy Ollama (thường tự chạy khi cài)
ollama serve

# Terminal 2: Chạy Qdrant
.\qdrant.exe

# Terminal 3: Chạy .NET Backend
cd Source/Tickify.Server
dotnet run

# Terminal 4: Chạy React Frontend
cd Source/tickify.client
npm run dev
```

### 5.2 Index dữ liệu lần đầu

```powershell
# Index events từ database (cần đăng nhập với Admin role)
Invoke-RestMethod -Uri "http://localhost:5179/api/chatbot/index/events" `
  -Method POST `
  -Headers @{Authorization = "Bearer YOUR_ADMIN_TOKEN"}

# Hoặc index document riêng lẻ:
$body = @{
    documents = @(
        @{
            content = "Hướng dẫn đặt vé: Bước 1 - Chọn sự kiện..."
            source = "FAQ - Đặt vé"
            sourceType = "faq"
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:5179/api/chatbot/index" `
  -Method POST `
  -Headers @{
      Authorization = "Bearer YOUR_ADMIN_TOKEN"
      "Content-Type" = "application/json"
  } `
  -Body $body
```

### 5.3 Kiểm tra status

```powershell
Invoke-RestMethod -Uri "http://localhost:5179/api/chatbot/status"

# Output:
# ollamaHealthy    : True
# qdrantHealthy    : True
# documentCount    : 150
# llmModel         : llama3.2
# embeddingModel   : nomic-embed-text
```

---

## 6. API Reference

### POST /api/chatbot/chat

**Request:**
```json
{
  "message": "Có sự kiện âm nhạc nào vào cuối tuần này không?",
  "conversationId": "optional-conversation-id",
  "history": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous response"}
  ]
}
```

**Response:**
```json
{
  "message": "Có một số sự kiện âm nhạc vào cuối tuần này:\n\n1. **Concert ABC** - Thứ 7, 20:00 tại Nhà hát Lớn\n2. **Festival XYZ** - Chủ nhật, 18:00 tại Công viên 23/9\n\nBạn muốn biết thêm chi tiết về sự kiện nào?",
  "conversationId": "conv-12345",
  "sources": [
    {
      "title": "Event: Concert ABC",
      "source": "event",
      "sourceType": "event",
      "relevanceScore": 0.92
    }
  ],
  "success": true
}
```

### POST /api/chatbot/chat/stream

**Response:** Server-Sent Events (SSE)
```
data: Có 
data: một 
data: số 
data: sự kiện 
data: ...
data: [DONE]
```

### GET /api/chatbot/status

**Response:**
```json
{
  "ollamaHealthy": true,
  "qdrantHealthy": true,
  "documentCount": 150,
  "llmModel": "llama3.2",
  "embeddingModel": "nomic-embed-text"
}
```

---

## 7. Ví dụ Conversation

### Scenario 1: Tìm kiếm sự kiện

```
👤 User: Có sự kiện nhạc rock nào trong tháng 12 không?

🤖 Assistant: Tôi tìm thấy 2 sự kiện nhạc rock trong tháng 12:

1. **Rock Storm 2024**
   - 📅 Ngày: 15/12/2024, 19:00
   - 📍 Địa điểm: Sân vận động Mỹ Đình
   - 🎫 Giá vé: từ 500.000đ

2. **Metallica Tribute Night**
   - 📅 Ngày: 22/12/2024, 20:00
   - 📍 Địa điểm: Nhà hát Bến Thành
   - 🎫 Giá vé: từ 350.000đ

Bạn muốn đặt vé cho sự kiện nào?
```

### Scenario 2: Hỏi về thanh toán

```
👤 User: Tôi có thể thanh toán bằng những phương thức nào?

🤖 Assistant: Tickify hỗ trợ các phương thức thanh toán sau:

1. **VNPay** - Thanh toán qua QR code hoặc thẻ ATM nội địa
2. **MoMo** - Ví điện tử MoMo
3. **Thẻ tín dụng/ghi nợ** - Visa, Mastercard

Lưu ý:
- Thời gian giữ vé là 15 phút sau khi chọn
- Thanh toán thành công sẽ nhận email xác nhận ngay

Bạn cần hỗ trợ gì thêm về thanh toán?
```

### Scenario 3: Hỏi về hoàn tiền

```
👤 User: Làm sao để hoàn tiền vé đã mua?

🤖 Assistant: Để yêu cầu hoàn tiền vé, bạn thực hiện các bước sau:

1. **Đăng nhập** vào tài khoản Tickify
2. Vào **"Vé của tôi"** → Chọn vé cần hoàn
3. Nhấn **"Yêu cầu hoàn tiền"**
4. Điền lý do và gửi yêu cầu

**Chính sách hoàn tiền:**
- Hoàn 100% nếu yêu cầu trước 7 ngày
- Hoàn 50% nếu yêu cầu trước 3 ngày
- Không hoàn nếu dưới 3 ngày

Thời gian xử lý: 3-5 ngày làm việc

Bạn cần hỗ trợ tạo yêu cầu hoàn tiền không?
```

---

## 8. Performance Optimization

### 8.1 Caching Embeddings

```csharp
// Trong RagService, có thể thêm cache cho embeddings
private readonly IMemoryCache _embeddingCache;

public async Task<float[]> GetCachedEmbeddingAsync(string text)
{
    var cacheKey = $"embedding_{text.GetHashCode()}";
    
    if (_embeddingCache.TryGetValue(cacheKey, out float[]? cached))
        return cached!;
    
    var embedding = await _ollamaService.GetEmbeddingAsync(text);
    
    _embeddingCache.Set(cacheKey, embedding, TimeSpan.FromHours(24));
    
    return embedding;
}
```

### 8.2 Batch Processing

```csharp
// Index nhiều documents cùng lúc
// Giảm số lần gọi API
var batchSize = 10;
for (var i = 0; i < chunks.Count; i += batchSize)
{
    var batch = chunks.Skip(i).Take(batchSize).ToList();
    // Process batch...
}
```

### 8.3 Token Limits

```csharp
// Giới hạn context để tránh exceed token limit
private string BuildContext(List<QdrantSearchResult> results)
{
    var maxContextLength = 2000; // characters
    var context = new StringBuilder();
    
    foreach (var result in results)
    {
        var content = result.Payload["content"]?.ToString() ?? "";
        
        if (context.Length + content.Length > maxContextLength)
            break;
            
        context.AppendLine(content);
    }
    
    return context.ToString();
}
```

---

## 9. Troubleshooting

### Lỗi: "Ollama is not responding"

```powershell
# Kiểm tra Ollama có đang chạy:
Get-Process ollama -ErrorAction SilentlyContinue

# Nếu không, khởi động:
ollama serve

# Test API:
Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
```

### Lỗi: "Qdrant connection failed"

```powershell
# Kiểm tra Qdrant:
Invoke-RestMethod -Uri "http://localhost:6333/"

# Nếu lỗi, chạy lại:
.\qdrant.exe
```

### Lỗi: "Empty response from LLM"

Nguyên nhân thường gặp:
1. Model chưa được pull về: `ollama pull llama3.2`
2. Không đủ RAM (cần ít nhất 8GB cho Llama3.2)
3. Timeout - tăng timeout trong HttpClient

### Lỗi: "No relevant documents found"

```powershell
# Kiểm tra số documents đã index:
Invoke-RestMethod -Uri "http://localhost:5179/api/chatbot/status"

# Nếu documentCount = 0, cần index lại:
Invoke-RestMethod -Uri "http://localhost:5179/api/chatbot/index/events" -Method POST
```

---

## 📚 Tài liệu tham khảo

- [Ollama Documentation](https://ollama.com/docs)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [RAG Paper](https://arxiv.org/abs/2005.11401)
- [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)

---

## 🤝 Đóng góp

Nếu bạn có câu hỏi hoặc đề xuất cải tiến, vui lòng tạo issue hoặc pull request!

**Happy Coding! 🚀**
