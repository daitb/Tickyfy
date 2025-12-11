// Types for RAG Chatbot

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceReference[];
}

export interface SourceReference {
  title: string;
  source: string;
  sourceType: string;
  relevanceScore: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  history?: { role: string; content: string }[];
  userId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  sources: SourceReference[];
  success: boolean;
  error?: string;
}

export interface RagStatus {
  ollamaHealthy: boolean;
  qdrantHealthy: boolean;
  documentCount: number;
  llmModel: string;
  embeddingModel: string;
}
