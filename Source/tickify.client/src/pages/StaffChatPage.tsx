import { useState, useEffect } from "react";
import { ChatList } from "../components/chat/ChatList";
import { ChatWindow } from "../components/chat/ChatWindow";
import { authService } from "../services/authService";
import { signalRService } from "../services/chatService";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function StaffChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const isStaff = user.role === "Admin" || user.role === "Staff";
    if (!isStaff) {
      navigate("/");
      return;
    }

    setCurrentUserId(parseInt(user.userId));

    // Initialize SignalR connection
    signalRService.startConnection().catch(console.error);

    return () => {
      signalRService.stopConnection().catch(console.error);
    };
  }, [navigate]);

  if (currentUserId === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          Customer Support Chat
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage customer conversations and provide real-time support
        </p>
      </div>
      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Sidebar - Chat List */}
        <div className="w-80 border rounded-lg flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Active Conversations
            </h2>
          </div>
          <ChatList
            onSelectConversation={setSelectedConversationId}
            selectedConversationId={selectedConversationId}
          />
        </div>

        {/* Main Chat Window */}
        <div className="flex-1 border rounded-lg">
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}

