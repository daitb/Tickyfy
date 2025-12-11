# 🤖 AI Chatbot RAG - Hướng Dẫn Cài Đặt (GROQ Edition)

## 🚀 Giới Thiệu

AI Chatbot sử dụng **RAG (Retrieval-Augmented Generation)** với các công cụ **MIỄN PHÍ 100%**:

| Component | Solution | Cost | Notes |
|-----------|----------|------|-------|
| **LLM** | Groq Cloud API | FREE | 14,400 req/ngày, cực nhanh |
| **Vector DB** | Qdrant Local | FREE | ~50MB, không Docker |
| **Embeddings** | HuggingFace API / Local | FREE | Tùy chọn |

## ⚡ Bước 1: Lấy Groq API Key (1 phút)

1. Truy cập: https://console.groq.com/
2. Đăng ký/đăng nhập bằng Google hoặc GitHub
3. Vào **API Keys** → **Create API Key**
4. Copy API key (bắt đầu bằng `gsk_...`)

> 💡 **Groq cho miễn phí:**
> - 14,400 requests/ngày
> - 500,000 tokens/phút
> - Models: llama-3.3-70b, mixtral-8x7b, gemma-7b

## ⚡ Bước 2: Cài Đặt Qdrant (Vector Database)

### Windows:
```powershell
# Tải Qdrant
Invoke-WebRequest -Uri "https://github.com/qdrant/qdrant/releases/download/v1.12.4/qdrant-x86_64-pc-windows-msvc.zip" -OutFile "qdrant.zip"

# Giải nén
Expand-Archive -Path "qdrant.zip" -DestinationPath "C:\qdrant"

# Chạy Qdrant
cd C:\qdrant
.\qdrant.exe
```

Qdrant sẽ chạy tại: `http://localhost:6333`

## ⚡ Bước 3: Cấu Hình appsettings.json

```json
{
  "Rag": {
    "GroqApiKey": "gsk_YOUR_API_KEY_HERE",
    "HuggingFaceApiKey": "",
    "LlmProvider": "groq",
    "EmbeddingProvider": "",
    "GroqModel": "llama-3.3-70b-versatile",
    "QdrantBaseUrl": "http://localhost:6333",
    "CollectionName": "tickify_documents",
    "VectorSize": 768,
    "TopK": 5,
    "ChunkSize": 500,
    "ChunkOverlap": 50,
    "MinRelevanceScore": 0.7
  }
}
```

> 🔑 **Chỉ cần điền `GroqApiKey`**, hệ thống tự chọn provider phù hợp!

## ⚡ Bước 4: Chạy Backend

```powershell
cd Source/Tickify.Server
dotnet run
```

## ⚡ Bước 5: Chạy Frontend

```powershell
cd Source/tickify.client
npm install
npm run dev
```

## 📊 Kiểm Tra Status

API Endpoint: `GET /api/chatbot/status`

Response example:
```json
{
  "llmHealthy": true,
  "qdrantHealthy": true,
  "embeddingHealthy": true,
  "documentCount": 50,
  "llmProvider": "groq",
  "embeddingProvider": "local"
}
```

## 🔧 Các API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/chatbot/chat` | Chat thường |
| POST | `/api/chatbot/stream` | Chat streaming |
| POST | `/api/chatbot/index/events` | Index events từ DB |
| POST | `/api/chatbot/index/markdown` | Index file markdown |
| GET | `/api/chatbot/status` | Kiểm tra trạng thái |

## 💬 Test Chat

```bash
curl -X POST http://localhost:5000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Có những sự kiện nào sắp diễn ra?",
    "conversationId": "test-123"
  }'
```

## 🎯 So Sánh Groq vs Ollama

| Feature | Groq (Recommended) | Ollama |
|---------|-------------------|--------|
| Cài đặt | Không cần | Download 1.2GB |
| Tốc độ | Cực nhanh | Phụ thuộc GPU |
| Hardware | Không yêu cầu | Cần RAM ≥8GB |
| Offline | ❌ | ✅ |
| Free tier | 14,400 req/ngày | Unlimited |

## 🛠️ Troubleshooting

### Lỗi "No LLM provider configured"
- Kiểm tra `GroqApiKey` trong appsettings.json
- Hoặc chạy Ollama nếu muốn dùng local

### Lỗi "Qdrant connection failed"
- Kiểm tra Qdrant đang chạy: http://localhost:6333
- Restart Qdrant nếu cần

### Lỗi CORS
- Đảm bảo Frontend URL trong `Cors.AllowedOrigins`

## 🎉 Done!

Chatbot widget sẽ xuất hiện ở góc phải dưới màn hình khi bạn mở frontend!
