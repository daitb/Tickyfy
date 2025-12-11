import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { MessageCircle, X, Send, Loader2, RefreshCw, Trash2, Bot, User, ChevronDown } from 'lucide-react';
import { useChatbot } from '../../hooks/useChatbot';
import type { ChatMessage } from '../../types/chatbot';
import { cn } from '../../utils/cn';

interface ChatbotWidgetProps {
  /** Vị trí hiển thị widget */
  position?: 'bottom-right' | 'bottom-left';
  /** Tiêu đề chatbot */
  title?: string;
  /** Placeholder cho input */
  placeholder?: string;
  /** Có cho phép streaming không */
  enableStreaming?: boolean;
}

/**
 * Component Chatbot Widget - Floating chat bubble
 */
export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  position = 'bottom-right',
  title = 'Tickify Assistant',
  placeholder = 'Nhập câu hỏi của bạn...',
  enableStreaming = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  } = useChatbot({ enableStreaming });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (inputValue.trim() && !isLoading && !isStreaming) {
      const message = inputValue;
      setInputValue('');
      await sendMessage(message);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 sm:right-6' 
    : 'left-4 sm:left-6';

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 sm:bottom-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300',
          'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
          'text-white hover:scale-110',
          positionClasses
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-20 sm:bottom-24 z-50 w-[95vw] sm:w-[400px] h-[500px] sm:h-[600px]',
            'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col',
            'border border-gray-200 dark:border-gray-700',
            'animate-in slide-in-from-bottom-5 duration-300',
            positionClasses
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-xs text-white/70">Online • Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearMessages}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Xóa lịch sử chat"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Loading indicator */}
            {isLoading && !isStreaming && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Đang suy nghĩ...</span>
              </div>
            )}
            
            {/* Error display */}
            {error && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                <span>{error}</span>
                <button
                  onClick={retryLastMessage}
                  className="flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  Thử lại
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className={cn(
                  'flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600',
                  'bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'max-h-32'
                )}
                style={{ minHeight: '44px' }}
                disabled={isLoading || isStreaming}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading || isStreaming}
                className={cn(
                  'p-3 rounded-xl transition-all duration-200',
                  'bg-gradient-to-r from-indigo-600 to-purple-600',
                  'hover:from-indigo-700 hover:to-purple-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'text-white shadow-lg hover:shadow-xl'
                )}
              >
                {isLoading || isStreaming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Nhấn Enter để gửi, Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Component hiển thị một tin nhắn
 */
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        
        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs opacity-70 mb-1">Nguồn tham khảo:</p>
            <ul className="text-xs space-y-1">
              {message.sources.slice(0, 3).map((source, idx) => (
                <li key={idx} className="opacity-80">
                  • {source.title || source.source}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Timestamp */}
        <p
          className={cn(
            'text-xs mt-1',
            isUser ? 'text-white/60' : 'text-gray-400'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

export default ChatbotWidget;
