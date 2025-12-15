import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { i18n, t } = useTranslation();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const lastUserMessageRef = useRef<string>('');
  const streamingMessageRef = useRef<string>('');
  const hasWelcomeMessageRef = useRef<boolean>(false);

  // Thêm welcome message khi component mount hoặc khi messages bị xóa
  useEffect(() => {
    if (messages.length === 0 && !hasWelcomeMessageRef.current) {
      hasWelcomeMessageRef.current = true;
      const welcomeContent = t('chatbot.welcome.description', {
        defaultValue: i18n.language === 'en' 
          ? 'Hello! I am Tickify Assistant. I can help you search for events, book tickets, or answer questions about Tickify. Ask me anything!'
          : 'Xin chào! Tôi là Tickify Assistant. Tôi có thể giúp bạn tìm kiếm sự kiện, đặt vé, hoặc giải đáp các thắc mắc về Tickify. Hãy hỏi tôi bất cứ điều gì!'
      });
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeContent,
          timestamp: new Date(),
        },
      ]);
    } else if (messages.length > 0) {
      hasWelcomeMessageRef.current = true;
    }
  }, [messages.length, i18n.language, t]);

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

      // Thêm tin nhắn của user ngay lập tức để hiển thị
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      // Sử dụng functional update để đảm bảo state được cập nhật đúng
      // Thêm tin nhắn user vào state
      setMessages((prev: ChatMessage[]) => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa (tránh duplicate)
        const exists = prev.some(msg => msg.id === userMessage.id);
        return exists ? prev : [...prev, userMessage];
      });
      setIsLoading(true);

      // Build history bao gồm tin nhắn user vừa thêm
      const currentHistory = buildHistory();
      const request: ChatRequest = {
        message: content.trim(),
        conversationId: conversationId || undefined,
        history: [...currentHistory, { role: 'user', content: content.trim() }],
        language: i18n.language, // Send current language to backend
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
            const errorMessage = t('chatbot.error.generic', {
              defaultValue: i18n.language === 'en'
                ? 'Sorry, an error occurred. Please try again.'
                : 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.'
            });
            setMessages((prev: ChatMessage[]) =>
              prev.map((msg: ChatMessage) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: errorMessage }
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
            const defaultError = i18n.language === 'en'
              ? 'An error occurred'
              : 'Đã có lỗi xảy ra';
            setError(response.error || defaultError);
          }
        } catch (err) {
          const defaultError = i18n.language === 'en'
            ? 'An error occurred'
            : 'Đã có lỗi xảy ra';
          setError(err instanceof Error ? err.message : defaultError);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [isLoading, isStreaming, conversationId, buildHistory, enableStreaming, i18n.language, t]
  );

  const clearMessages = useCallback(() => {
    hasWelcomeMessageRef.current = false;
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
