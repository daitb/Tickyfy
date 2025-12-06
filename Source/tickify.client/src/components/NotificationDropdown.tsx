import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Ticket, Calendar, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import notificationService, { type Notification } from '../services/notificationService';
import notificationSignalRService from '../services/notificationSignalRService';
import { authService } from '../services/authService';

interface NotificationDropdownProps {
  onNavigate?: (page: string, id?: string) => void;
}

export function NotificationDropdown({ onNavigate }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isAuthenticated = authService.isAuthenticated();

  // Fetch notifications khi component mount và khi dropdown mở
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications();
    }
  }, [isOpen, isAuthenticated]);

  // Setup SignalR connection khi component mount
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch unread count ngay lập tức
    fetchUnreadCount();

    // Setup SignalR connection
    const setupSignalR = async () => {
      try {
        await notificationSignalRService.startConnection();

        // Đăng ký handler để nhận notifications mới
        const unsubscribe = notificationSignalRService.onNotificationReceived((notification) => {
          // Thêm notification mới vào đầu danh sách
          setNotifications(prev => {
            // Kiểm tra xem đã có notification này chưa (tránh duplicate)
            if (prev.some(n => n.id === notification.id)) {
              return prev;
            }
            return [notification, ...prev];
          });

          // Cập nhật unread count
          if (!notification.isRead) {
            setUnreadCount(prev => prev + 1);
          }

          // Hiển thị toast notification (optional)
          // toast.info(notification.title, { description: notification.message });
        });

        return unsubscribe;
      } catch (error) {
        console.error('[NotificationDropdown] Error setting up SignalR:', error);
      }
    };

    let unsubscribe: (() => void) | undefined;
    setupSignalR().then(unsub => {
      unsubscribe = unsub;
    });

    // Setup interval để sync unread count (mỗi 30 giây)
    const interval = setInterval(fetchUnreadCount, 30000);

    // Cleanup khi component unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(interval);
      notificationSignalRService.stopConnection().catch(console.error);
    };
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    // Chỉ hiện loading khi lần đầu load hoặc chưa có data
    if (isInitialLoad || notifications.length === 0) {
      setIsLoading(true);
    }
    try {
      // Lấy 20 notifications đầu tiên cho dropdown
      const result = await notificationService.getNotifications(1, 20);
      setNotifications(result.items);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('[NotificationDropdown] Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('[NotificationDropdown] Error fetching unread count:', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return <Ticket size={18} className="text-purple-600" />;
      case 'event':
        return <Calendar size={18} className="text-blue-600" />;
      case 'payment':
        return <CreditCard size={18} className="text-green-600" />;
      case 'system':
        return <AlertCircle size={18} className="text-orange-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      console.log('[NotificationDropdown] Marking notification as read:', id);
      const success = await notificationService.markAsRead(id);
      console.log('[NotificationDropdown] Mark as read result:', success);
      if (success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        // Cập nhật unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('[NotificationDropdown] Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await notificationService.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Đóng dropdown trước để tránh nhấp nháy
    setIsOpen(false);
    
    // Đánh dấu đã đọc (không await để navigation nhanh hơn)
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type or actionUrl
    if (notification.actionUrl) {
      // Extract route from actionUrl (e.g., "/orders/123" -> "orders")
      const parts = notification.actionUrl.split('/').filter(Boolean);
      const route = parts[0];
      const id = parts[1];
      
      if (route === 'orders' || route === 'bookings') {
        onNavigate?.('order-detail', id);
      } else if (route === 'events') {
        onNavigate?.('event-detail', id);
      } else if (route === 'tickets') {
        onNavigate?.('ticket-detail', id);
      } else if (route === 'refunds') {
        onNavigate?.('refund-history');
      } else {
        onNavigate?.(route, id);
      }
    } else {
      // Fallback navigation based on type
      switch (notification.type) {
        case 'booking':
        case 'ticket':
          onNavigate?.('my-tickets');
          break;
        case 'event':
          onNavigate?.('home');
          break;
        case 'payment':
          onNavigate?.('my-tickets');
          break;
        default:
          onNavigate?.('notifications');
      }
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer relative text-white hover:bg-teal-600 overflow-visible"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-teal-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-purple-600 hover:text-purple-700 h-auto p-1"
            >
              <Check size={14} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading && notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Loader2 size={24} className="mx-auto mb-3 animate-spin" />
            <p className="text-sm">Đang tải thông báo...</p>
          </div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-purple-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {notification.timestamp}
                        </span>
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Chưa có thông báo</p>
            <p className="text-xs mt-1">Bạn sẽ nhận được thông báo khi có sự kiện quan trọng</p>
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.('notifications');
              }}
              className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              View All Notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
