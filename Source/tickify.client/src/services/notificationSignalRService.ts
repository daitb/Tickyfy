import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import type { Notification } from "./notificationService";

/**
 * SignalR Service cho NotificationHub
 * Quản lý kết nối real-time để nhận notifications
 */
class NotificationSignalRService {
  private connection: signalR.HubConnection | null = null;
  private baseUrl: string;
  private notificationHandlers: Set<(notification: Notification) => void> = new Set();
  private unreadCountHandlers: Set<(count: number) => void> = new Set();

  constructor() {
    // Lấy API base URL từ environment hoặc dùng default
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5179";
  }

  /**
   * Khởi tạo kết nối SignalR đến NotificationHub
   */
  async startConnection(): Promise<void> {
    // Nếu đã kết nối rồi thì không cần kết nối lại
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    // Lấy token từ localStorage
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("[NotificationSignalR] No auth token found, skipping connection");
      return;
    }

    // Tạo connection đến NotificationHub
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/notifications`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 1000, 2000, 4000, 8000, 30000])
      .build();

    // Setup event handlers
    this.setupEventHandlers();

    try {
      await this.connection.start();
      console.log("[NotificationSignalR] Connected to NotificationHub");
    } catch (error: any) {
      console.error("[NotificationSignalR] Failed to connect:", error);
      // Không hiển thị toast để tránh spam khi user chưa login
      throw error;
    }
  }

  /**
   * Setup các event handlers cho SignalR
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Nhận notification mới
    this.connection.on("ReceiveNotification", (notificationDto: any) => {
      console.log("[NotificationSignalR] Received notification:", notificationDto);
      
      // Convert backend DTO sang frontend Notification format
      const notification: Notification = {
        id: notificationDto.notificationId.toString(),
        type: this.mapNotificationType(notificationDto.type),
        title: notificationDto.title,
        message: notificationDto.message,
        timestamp: this.formatTimestamp(notificationDto.createdAt),
        isRead: notificationDto.isRead,
        actionUrl: notificationDto.actionUrl,
      };

      // Gọi tất cả handlers đã đăng ký
      this.notificationHandlers.forEach((handler) => {
        try {
          handler(notification);
        } catch (error) {
          console.error("[NotificationSignalR] Error in notification handler:", error);
        }
      });

      // Hiển thị desktop notification nếu được phép
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/vite.svg",
          tag: notification.id,
        });
      }
    });

    // Connection events
    this.connection.onclose((error) => {
      if (error) {
        console.error("[NotificationSignalR] Connection closed with error:", error);
      } else {
        console.log("[NotificationSignalR] Connection closed");
      }
    });

    this.connection.onreconnecting((error) => {
      console.log("[NotificationSignalR] Reconnecting...", error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log("[NotificationSignalR] Reconnected with connection ID:", connectionId);
    });
  }

  /**
   * Dừng kết nối SignalR
   */
  async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.notificationHandlers.clear();
      this.unreadCountHandlers.clear();
      console.log("[NotificationSignalR] Connection stopped");
    }
  }

  /**
   * Đăng ký handler để nhận notifications mới
   */
  onNotificationReceived(handler: (notification: Notification) => void): () => void {
    this.notificationHandlers.add(handler);
    
    // Trả về function để unsubscribe
    return () => {
      this.notificationHandlers.delete(handler);
    };
  }

  /**
   * Đăng ký handler để nhận unread count updates
   */
  onUnreadCountUpdated(handler: (count: number) => void): () => void {
    this.unreadCountHandlers.add(handler);
    
    // Trả về function để unsubscribe
    return () => {
      this.unreadCountHandlers.delete(handler);
    };
  }

  /**
   * Xác nhận đã nhận notification (optional, backend có thể dùng để tracking)
   */
  async confirmNotificationReceived(notificationId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke("NotificationReceived", notificationId);
      } catch (error) {
        console.error("[NotificationSignalR] Error confirming notification:", error);
      }
    }
  }

  /**
   * Lấy trạng thái kết nối
   */
  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  /**
   * Map notification type từ backend sang frontend
   */
  private mapNotificationType(backendType: string): Notification['type'] {
    const typeMap: Record<string, Notification['type']> = {
      'BookingConfirmed': 'booking',
      'PaymentSuccess': 'payment',
      'PaymentFailed': 'payment',
      'EventApproved': 'event',
      'EventRejected': 'event',
      'EventReminder': 'event',
      'TicketTransfer': 'ticket',
      'RefundApproved': 'payment',
      'RefundRejected': 'payment',
      'WaitlistAvailable': 'event',
    };

    if (!typeMap[backendType]) {
      if (backendType.includes('Booking') || backendType.includes('Ticket')) return 'booking';
      if (backendType.includes('Payment') || backendType.includes('Refund')) return 'payment';
      if (backendType.includes('Event')) return 'event';
    }

    return typeMap[backendType] || 'system';
  }

  /**
   * Format timestamp thành relative time string
   */
  private formatTimestamp(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    if (weeks < 4) return `${weeks} tuần trước`;
    if (months < 12) return `${months} tháng trước`;
    return time.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

export const notificationSignalRService = new NotificationSignalRService();
export default notificationSignalRService;

