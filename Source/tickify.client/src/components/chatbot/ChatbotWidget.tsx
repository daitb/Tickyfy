import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  RefreshCw,
  Trash2,
  Bot,
  User,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatbot } from "../../hooks/useChatbot";
import type { ChatMessage } from "../../types/chatbot";
import { cn } from "../../utils/cn";

interface ChatbotWidgetProps {
  /** Vị trí hiển thị widget */
  position?: "bottom-right" | "bottom-left";
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
  position = "bottom-right",
  title,
  placeholder,
  enableStreaming = true,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use translation for default values
  const widgetTitle = title || t("chatbot.title", "Tickify Assistant");
  const widgetPlaceholder =
    placeholder || t("chatbot.placeholder", "Type your question...");

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      setInputValue("");
      await sendMessage(message);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const positionClasses =
    position === "bottom-right" ? "right-4 sm:right-6" : "left-4 sm:left-6";

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 sm:bottom-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300",
          "bg-teal-500 hover:bg-teal-600",
          "text-white hover:scale-110 active:scale-95",
          "ring-2 ring-teal-200/50 dark:ring-teal-800/30",
          "animate-in fade-in zoom-in duration-500",
          positionClasses
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
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
            "fixed bottom-20 sm:bottom-24 z-50 w-[95vw] sm:w-[400px] h-[500px] sm:h-[600px]",
            "bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col",
            "border border-neutral-200 dark:border-neutral-700",
            "animate-in slide-in-from-bottom-5 duration-300",
            positionClasses
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-teal-100 dark:border-teal-900/30 bg-teal-500 dark:bg-teal-600 rounded-t-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {widgetTitle}
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-teal-200 rounded-full"></div>
                  <p className="text-xs text-white/90 font-normal">
                    {t("chatbot.online", "Online")} •{" "}
                    {t("chatbot.poweredBy", "Powered by AI")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearMessages}
                className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                title={t("chatbot.clearHistory", "Clear chat history")}
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                title={t("chatbot.close", "Close chat")}
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-gray-900/50 scroll-smooth">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-full mb-4">
                  <Bot className="w-12 h-12 text-teal-500 dark:text-teal-400" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                  {t("chatbot.emptyState.title", {
                    title: widgetTitle,
                    defaultValue: `Welcome to ${widgetTitle}!`,
                  })}
                </h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
                  {t(
                    "chatbot.emptyState.description",
                    "I can help you search for events, book tickets, or answer questions. Let's start a conversation!"
                  )}
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {/* Loading indicator */}
                {isLoading && !isStreaming && (
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-gray-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                    <span className="text-sm font-medium">
                      {t("chatbot.thinking", "Thinking...")}
                    </span>
                  </div>
                )}

                {/* Error display */}
                {error && (
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm shadow-sm">
                    <span className="font-medium">{error}</span>
                    <button
                      onClick={retryLastMessage}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-800/50 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t("chatbot.retry", "Retry")}
                    </button>
                  </div>
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-gray-900 rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={widgetPlaceholder}
                rows={1}
                className={cn(
                  "flex-1 resize-none rounded-xl border border-neutral-300 dark:border-neutral-600",
                  "bg-white dark:bg-gray-800 px-4 py-3 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500",
                  "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                  "transition-all duration-200",
                  "max-h-32 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
                style={{ minHeight: "44px" }}
                disabled={isLoading || isStreaming}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading || isStreaming}
                className={cn(
                  "p-3 rounded-xl transition-all duration-200",
                  "bg-teal-500 hover:bg-teal-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "text-white shadow-md hover:shadow-lg hover:scale-105",
                  "active:scale-95 flex items-center justify-center"
                )}
                title={t("chatbot.send", "Send message")}
              >
                {isLoading || isStreaming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {t("chatbot.enterToSend", "Press")}{" "}
                <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs font-mono">
                  Enter
                </kbd>{" "}
                {t("chatbot.toSend", "to send")},{" "}
                <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs font-mono">
                  {t("chatbot.shiftEnter", "Shift+Enter")}
                </kbd>{" "}
                {t("chatbot.toNewLine", "to new line")}
              </p>
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  title={t("chatbot.clearHistory", "Clear chat history")}
                >
                  {t("chatbot.clear", "Clear")}
                </button>
              )}
            </div>
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
  const { t } = useTranslation();
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-105",
          isUser
            ? "bg-teal-500 text-white ring-2 ring-teal-100 dark:ring-teal-900/50"
            : "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 ring-2 ring-teal-50 dark:ring-teal-900/20"
        )}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md",
          isUser
            ? "bg-teal-500 text-white rounded-tr-sm"
            : "bg-white dark:bg-gray-800 text-neutral-800 dark:text-neutral-100 rounded-tl-sm border border-neutral-200 dark:border-neutral-700"
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-600">
            <p className="text-xs font-semibold opacity-90 mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
              {t("chatbot.sources.title", "Reference sources:")}
            </p>
            <ul className="text-xs space-y-1.5">
              {message.sources.slice(0, 3).map((source, idx) => (
                <li
                  key={idx}
                  className="opacity-80 hover:opacity-100 transition-opacity flex items-start gap-1.5"
                >
                  <span className="text-teal-400 dark:text-teal-500 mt-0.5">
                    •
                  </span>
                  <span>{source.title || source.source}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            "text-xs mt-2 font-normal",
            isUser ? "text-white/80" : "text-neutral-400 dark:text-neutral-500"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export default ChatbotWidget;
