import { useState, useEffect } from "react";
import { ChatList } from "../components/chat/ChatList";
import { ChatWindow } from "../components/chat/ChatWindow";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { chatService, signalRService } from "../services/chatService";
import { authService } from "../services/authService";
import { MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";

export function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUserId(parseInt(user.userId));
    }

    // Initialize SignalR connection
    signalRService.startConnection().catch(console.error);

    return () => {
      signalRService.stopConnection().catch(console.error);
    };
  }, []);

  const handleCreateConversation = async () => {
    if (!initialMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setCreating(true);
    try {
      const conversation = await chatService.createConversation({
        initialMessage: initialMessage.trim(),
      });
      setSelectedConversationId(conversation.id);
      setIsCreateDialogOpen(false);
      setInitialMessage("");
      toast.success("Conversation created successfully");
      // Trigger reload of conversations list
      window.dispatchEvent(new Event('chat:reload'));
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create conversation";
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (currentUserId === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="flex gap-4 h-full">
        {/* Sidebar - Chat List */}
        <div className="w-80 border rounded-lg flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Textarea
                    placeholder="Type your message..."
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateConversation} disabled={creating}>
                      {creating ? "Creating..." : "Start Chat"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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

