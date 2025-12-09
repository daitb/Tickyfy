import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { chatService, signalRService, type ChatMessage, type ChatConversationDetail } from "../../services/chatService";
import { Send, Loader2 } from "lucide-react";

interface ChatWindowProps {
  conversationId: number | null;
  currentUserId: number;
}

export function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  const [conversation, setConversation] = useState<ChatConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      return;
    }

    loadConversation();
    joinConversation();

    // Set up SignalR handlers
    const receiveHandler = (msg: ChatMessage) => handleNewMessage(msg);
    const readHandler = (data: { conversationId: number; userId: number }) => handleMessagesRead(data);
    
    signalRService.onReceiveMessage(receiveHandler);
    signalRService.onMessagesRead(readHandler);

    return () => {
      if (conversationId) {
        signalRService.leaveConversation(conversationId);
      }
      signalRService.removeHandlers();
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const data = await chatService.getConversationDetail(conversationId);
      setConversation(data);
      setMessages(data.messages);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinConversation = async () => {
    if (!conversationId) return;

    try {
      await signalRService.startConnection();
      await signalRService.joinConversation(conversationId);
    } catch (error) {
      console.error("Error joining conversation:", error);
    }
  };

  const handleNewMessage = (newMessage: ChatMessage) => {
    // Only add if message is for current conversation
    if (newMessage.chatConversationId === conversationId) {
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        if (prev.some(m => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      
      // Mark as read if it's not from current user
      if (newMessage.senderId !== currentUserId) {
        chatService.markAsRead(conversationId!);
      }
    }
  };

  const handleMessagesRead = (data: { conversationId: number; userId: number }) => {
    if (data.conversationId === conversationId && data.userId !== currentUserId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === currentUserId ? { ...msg, isRead: true } : msg
        )
      );
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !conversationId || sending) return;

    setSending(true);
    try {
      await signalRService.sendMessage({
        chatConversationId: conversationId,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a conversation to start chatting
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={conversation?.userProfilePicture} />
            <AvatarFallback>
              {conversation?.userName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{conversation?.userName || "Unknown User"}</h3>
            <p className="text-sm text-muted-foreground">{conversation?.userEmail || ""}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isOwnMessage = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.senderProfilePicture} />
                  <AvatarFallback>
                    {msg.senderName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : ""}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isOwnMessage && msg.isRead && " ✓✓"}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button onClick={sendMessage} disabled={sending || !message.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

