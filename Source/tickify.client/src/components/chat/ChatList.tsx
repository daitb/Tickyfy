import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { chatService, signalRService, type ChatConversation } from "../../services/chatService";
import { Loader2, MessageCircle } from "lucide-react";
import { authService } from "../../services/authService";

interface ChatListProps {
  onSelectConversation: (conversationId: number) => void;
  selectedConversationId: number | null;
}

export function ChatList({ onSelectConversation, selectedConversationId }: ChatListProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isStaff = user?.role === "Admin" || user?.role === "Staff";

  useEffect(() => {
    loadConversations();
    setupSignalR();

    // Listen for reload events
    const handleReload = () => {
      loadConversations();
    };
    window.addEventListener('chat:reload', handleReload);

    return () => {
      signalRService.removeHandlers();
      window.removeEventListener('chat:reload', handleReload);
    };
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupSignalR = async () => {
    try {
      await signalRService.startConnection();
      
      // Listen for new messages
      signalRService.onNewMessage((message) => {
        // Update conversation list when new message arrives
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === message.chatConversationId) {
              return {
                ...conv,
                lastMessage: message,
                updatedAt: message.createdAt,
                unreadCount: isStaff && message.senderId !== parseInt(user?.userId || "0") 
                  ? (conv.unreadCount || 0) + 1 
                  : !isStaff && message.isStaffMessage
                  ? (conv.unreadCount || 0) + 1
                  : conv.unreadCount,
              };
            }
            return conv;
          })
        );
      });
    } catch (error) {
      console.error("Error setting up SignalR:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedConversationId === conversation.id
                ? "bg-primary/10 border border-primary"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={isStaff ? conversation.userProfilePicture : undefined} />
                <AvatarFallback>
                  {isStaff
                    ? conversation.userName?.charAt(0).toUpperCase() || "U"
                    : conversation.staffName?.charAt(0).toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">
                    {isStaff ? conversation.userName : conversation.staffName || "Support"}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
                {conversation.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate">
                    {conversation.lastMessage.message}
                  </p>
                )}
                {conversation.updatedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

