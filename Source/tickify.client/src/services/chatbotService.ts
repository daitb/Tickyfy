import apiClient from './apiClient';
import type { ChatRequest, ChatResponse, RagStatus } from '../types/chatbot';

const BASE_URL = '/chatbot';

/**
 * Service để tương tác với RAG Chatbot API
 */
export const chatbotService = {
  /**
   * Gửi tin nhắn và nhận phản hồi từ chatbot
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>(`${BASE_URL}/chat`, request);
    return response.data;
  },

  /**
   * Stream phản hồi từ chatbot (Server-Sent Events)
   */
  async streamMessage(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to chatbot');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            
            if (data.startsWith('[ERROR]')) {
              onError(new Error(data));
              return;
            }
            
            onChunk(data);
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  },

  /**
   * Lấy trạng thái của RAG system
   */
  async getStatus(): Promise<RagStatus> {
    const response = await apiClient.get<RagStatus>(`${BASE_URL}/status`);
    return response.data;
  },

  /**
   * Index events từ database (Admin only)
   */
  async indexEvents(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`${BASE_URL}/index/events`);
    return response.data;
  },
};

export default chatbotService;
