import apiClient from "./apiClient";
import * as signalR from "@microsoft/signalr";

// ===== INTERFACES =====
export interface ChatMessage {
  id: number;
  chatConversationId: number;
  senderId: number;
  senderName: string;
  senderProfilePicture?: string;
  message: string;
  isStaffMessage: boolean;
  createdAt: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: number;
  userId: number;
  userName: string;
  userProfilePicture?: string;
  staffId?: number;
  staffName?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ChatConversationDetail {
  id: number;
  userId: number;
  userName: string;
  userProfilePicture?: string;
  userEmail: string;
  staffId?: number;
  staffName?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  messages: ChatMessage[];
}

export interface CreateChatConversationDto {
  initialMessage: string;
}

export interface SendMessageDto {
  chatConversationId: number;
  message: string;
}

// ===== CHAT SERVICE =====
class ChatService {
  private baseUrl = "/chat"; // apiClient already has /api prefix

  /**
   * Create a new chat conversation
   */
  async createConversation(data: CreateChatConversationDto): Promise<ChatConversation> {
    const response = await apiClient.post<ChatConversation>(
      `${this.baseUrl}/conversations`,
      data
    );
    // apiClient interceptor already extracts data, so response.data is the ChatConversation directly
    return response.data;
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<ChatConversation[]> {
    const response = await apiClient.get<ChatConversation[]>(
      `${this.baseUrl}/conversations`
    );
    // apiClient interceptor already extracts data
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Get conversation details with messages
   */
  async getConversationDetail(id: number): Promise<ChatConversationDetail> {
    const response = await apiClient.get<ChatConversationDetail>(
      `${this.baseUrl}/conversations/${id}`
    );
    // apiClient interceptor already extracts data
    return response.data as ChatConversationDetail;
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/conversations/${conversationId}/read`);
  }

  /**
   * Update conversation status
   */
  async updateStatus(conversationId: number, status: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/conversations/${conversationId}/status`, { status });
  }

  /**
   * Assign conversation to staff
   */
  async assignConversation(conversationId: number, staffId?: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/conversations/${conversationId}/assign`, { staffId });
  }
}

// ===== SIGNALR CONNECTION SERVICE =====
class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private baseUrl: string;

  constructor() {
    // Get API base URL from environment or use default
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5179";
  }

  /**
   * Initialize SignalR connection
   */
  async startConnection(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/chat`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log("SignalR connection established");
    } catch (error) {
      console.error("Error starting SignalR connection:", error);
      throw error;
    }
  }

  /**
   * Stop SignalR connection
   */
  async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  /**
   * Join a conversation room
   */
  async joinConversation(conversationId: number): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }
    if (this.connection) {
      await this.connection.invoke("JoinConversation", conversationId);
    }
  }

  /**
   * Leave a conversation room
   */
  async leaveConversation(conversationId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("LeaveConversation", conversationId);
    }
  }

  /**
   * Send a message via SignalR
   */
  async sendMessage(dto: SendMessageDto): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }
    if (this.connection) {
      await this.connection.invoke("SendMessage", dto);
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("MarkAsRead", conversationId);
    }
  }

  /**
   * Register handler for receiving messages
   */
  onReceiveMessage(callback: (message: ChatMessage) => void): void {
    if (this.connection) {
      this.connection.on("ReceiveMessage", callback);
    }
  }

  /**
   * Register handler for new messages (notifications)
   */
  onNewMessage(callback: (message: ChatMessage) => void): void {
    if (this.connection) {
      this.connection.on("NewMessage", callback);
    }
  }

  /**
   * Register handler for messages read event
   */
  onMessagesRead(callback: (data: { conversationId: number; userId: number }) => void): void {
    if (this.connection) {
      this.connection.on("MessagesRead", callback);
    }
  }

  /**
   * Register handler for errors
   */
  onError(callback: (error: string) => void): void {
    if (this.connection) {
      this.connection.on("Error", callback);
    }
  }

  /**
   * Remove all handlers
   */
  removeHandlers(): void {
    if (this.connection) {
      this.connection.off("ReceiveMessage");
      this.connection.off("NewMessage");
      this.connection.off("MessagesRead");
      this.connection.off("Error");
    }
  }

  /**
   * Get connection state
   */
  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }
}

export const chatService = new ChatService();
export const signalRService = new SignalRService();

