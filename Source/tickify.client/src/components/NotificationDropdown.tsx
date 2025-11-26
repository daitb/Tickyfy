import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, Ticket, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';

interface Notification {
  id: string;
  type: 'booking' | 'event' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationDropdownProps {
  onNavigate?: (page: string, id?: string) => void;
}

export function NotificationDropdown({ onNavigate }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking for "Summer Music Festival 2025" has been confirmed.',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      isRead: false,
    },
    {
      id: '2',
      type: 'event',
      title: 'Event Reminder',
      message: 'Concert XYZ starts in 2 hours. Don\'t forget to bring your tickets!',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      isRead: false,
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Successful',
      message: 'Payment of $150.00 has been processed successfully.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      isRead: false,
    },
    {
      id: '4',
      type: 'system',
      title: 'Profile Update',
      message: 'Your profile information has been updated successfully.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isRead: true,
    },
    {
      id: '5',
      type: 'event',
      title: 'New Event',
      message: 'A new event "Tech Conference 2025" matching your interests is now available.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      isRead: true,
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.type === 'booking') {
      onNavigate?.('my-tickets');
    } else if (notification.type === 'event') {
      onNavigate?.('home');
    } else if (notification.type === 'payment') {
      onNavigate?.('my-tickets');
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
          <h3 className="font-semibold text-lg">Notifications</h3>
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
        {notifications.length > 0 ? (
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
                          {getTimeAgo(notification.timestamp)}
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
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">We'll notify you when something important happens</p>
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
