import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatRequest } from '../types/chatbot';
import chatbotService from '../services/chatbotService';

interface UseChatbotOptions {
  enableStreaming?: boolean;
}

interface UseChatbotReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

/**
 * Custom hook để quản lý chatbot state và logic
 */
export function useChatbot(options: UseChatbotOptions = {}): UseChatbotReturn {
  const { enableStreaming = true } = options;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const lastUserMessageRef = useRef<string>('');
  const streamingMessageRef = useRef<string>('');

  // Thêm welcome message khi component mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Xin chào! Tôi là Tickify Assistant. Tôi có thể giúp bạn tìm kiếm sự kiện, đặt vé, hoặc giải đáp các thắc mắc về Tickify. Hãy hỏi tôi bất cứ điều gì!',
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const buildHistory = useCallback((): { role: string; content: string }[] => {
    return messages.slice(-10).map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content,
    }));
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || isStreaming) return;

      setError(null);
      lastUserMessageRef.current = content;

      // Thêm tin nhắn của user
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
      setIsLoading(true);

      const request: ChatRequest = {
        message: content.trim(),
        conversationId: conversationId || undefined,
        history: buildHistory(),
      };

      if (enableStreaming) {
        // Streaming mode
        setIsStreaming(true);
        streamingMessageRef.current = '';

        const assistantMessageId = `assistant-${Date.now()}`;

        // Thêm placeholder message
        setMessages((prev: ChatMessage[]) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: '',
            timestamp: new Date(),
          },
        ]);

        await chatbotService.streamMessage(
          request,
          (chunk) => {
            // Cập nhật streaming message
            streamingMessageRef.current += chunk;
            setMessages((prev: ChatMessage[]) =>
              prev.map((msg: ChatMessage) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: streamingMessageRef.current }
                  : msg
              )
            );
          },
          () => {
            // Hoàn thành
            setIsStreaming(false);
            setIsLoading(false);
          },
          (err) => {
            // Lỗi
            setError(err.message);
            setIsStreaming(false);
            setIsLoading(false);
            setMessages((prev: ChatMessage[]) =>
              prev.map((msg: ChatMessage) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' }
                  : msg
              )
            );
          }
        );
      } else {
        // Non-streaming mode
        try {
          const response = await chatbotService.sendMessage(request);

          if (response.success) {
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: response.message,
              timestamp: new Date(),
              sources: response.sources,
            };

            setMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);
            setConversationId(response.conversationId);
          } else {
            setError(response.error || 'Đã có lỗi xảy ra');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
        } finally {
          setIsLoading(false);
        }
      }
    },
    [isLoading, isStreaming, conversationId, buildHistory, enableStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      // Xóa tin nhắn cuối (assistant message bị lỗi)
      setMessages((prev: ChatMessage[]) => prev.slice(0, -1));
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}

export default useChatbot;
