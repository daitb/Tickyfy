import apiClient from "./apiClient";
import { toast } from "sonner";

// Backend DTOs - mapping với NotificationDto từ backend
export interface NotificationDto {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// Frontend Notification interface để sử dụng trong components
export interface Notification {
  id: string;
  type: 'booking' | 'event' | 'payment' | 'system' | 'ticket' | 'promo';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

/**
 * Mapping notification type từ backend sang frontend type
 */
function mapNotificationType(backendType: string): Notification['type'] {
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

  // Fallback: nếu không có trong map thì kiểm tra prefix
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
function formatTimestamp(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  time.setHours(time.getHours() + 7);
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

/**
 * Convert backend NotificationDto sang frontend Notification
 */
function mapNotificationDtoToNotification(dto: NotificationDto): Notification {
  return {
    id: dto.notificationId.toString(),
    type: mapNotificationType(dto.type),
    title: dto.title,
    message: dto.message,
    timestamp: formatTimestamp(dto.createdAt),
    isRead: dto.isRead,
    actionUrl: dto.actionUrl,
  };
}

/**
 * Paged result từ API
 */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Notification Service - quản lý notifications từ API
 */
class NotificationService {
  /**
   * Lấy danh sách notifications của user hiện tại (với pagination & filtering)
   */
  async getNotifications(
    page: number = 1,
    pageSize: number = 20,
    type?: string,
    isRead?: boolean
  ): Promise<PagedResult<Notification>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (type) params.append('type', type);
      if (isRead !== undefined) params.append('isRead', isRead.toString());

      const response = await apiClient.get<{
        items: NotificationDto[];
        pageNumber: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
      }>(`/notifications?${params.toString()}`);

      return {
        items: response.data.items.map(mapNotificationDtoToNotification),
        pageNumber: response.data.pageNumber,
        pageSize: response.data.pageSize,
        totalCount: response.data.totalCount,
        totalPages: response.data.totalPages,
        hasPreviousPage: response.data.hasPreviousPage,
        hasNextPage: response.data.hasNextPage,
      };
    } catch (error: any) {
      console.error("[NotificationService] Error fetching notifications:", error);
      if (error.response?.status !== 401) {
        toast.error("Không thể tải thông báo. Vui lòng thử lại sau.");
      }
      // Return empty paged result
      return {
        items: [],
        pageNumber: 1,
        pageSize: pageSize,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
  }

  /**
   * Lấy số lượng notifications chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<number>("/notifications/unread-count");
      return response.data;
    } catch (error: any) {
      console.error("[NotificationService] Error fetching unread count:", error);
      return 0;
    }
  }

  /**
   * Đánh dấu một notification là đã đọc
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      return true;
    } catch (error: any) {
      console.error("[NotificationService] Error marking notification as read:", error);
      if (error.response?.status !== 401) {
        toast.error("Không thể đánh dấu đã đọc. Vui lòng thử lại sau.");
      }
      return false;
    }
  }

  /**
   * Đánh dấu tất cả notifications là đã đọc
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.put("/notifications/read-all");
      return true;
    } catch (error: any) {
      console.error("[NotificationService] Error marking all notifications as read:", error);
      if (error.response?.status !== 401) {
        toast.error("Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại sau.");
      }
      return false;
    }
  }

  /**
   * Xóa một notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      return true;
    } catch (error: any) {
      console.error("[NotificationService] Error deleting notification:", error);
      if (error.response?.status !== 401) {
        toast.error("Không thể xóa thông báo. Vui lòng thử lại sau.");
      }
      return false;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

