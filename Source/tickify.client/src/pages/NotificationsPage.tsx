import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Calendar, Ticket, CreditCard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import notificationService, { type Notification } from '../services/notificationService';

interface NotificationsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [activeType, setActiveType] = useState<'all' | Notification['type']>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
    {
      id: '1',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking for "Summer Music Festival 2025" has been confirmed. Booking ID: #BK-2025-001234',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: '2',
      type: 'event',
      title: 'Event Reminder',
      message: 'Concert XYZ starts in 2 hours at National Stadium. Don\'t forget to bring your tickets and arrive 30 minutes early for check-in.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Successful',
      message: 'Payment of $150.00 has been processed successfully for 2 tickets to "Tech Conference 2025".',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: '4',
      type: 'event',
      title: 'Event Cancelled',
      message: 'Unfortunately, "Jazz Night Concert" scheduled for Dec 15 has been cancelled. Full refund will be processed within 5-7 business days.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: '5',
      type: 'booking',
      title: 'Ticket Transfer Received',
      message: 'John Smith has transferred 1 ticket for "Rock Festival 2025" to you. View your tickets to see details.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: '6',
      type: 'system',
      title: 'Profile Update',
      message: 'Your profile information has been updated successfully.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: '7',
      type: 'event',
      title: 'New Event Available',
      message: 'A new event "Tech Conference 2025" matching your interests is now available. Early bird tickets end in 3 days.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: '8',
      type: 'payment',
      title: 'Refund Processed',
      message: 'Refund of $75.00 for cancelled event "Comedy Show" has been processed. It will appear in your account within 3-5 business days.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: '9',
      type: 'booking',
      title: 'Waitlist Spot Available',
      message: 'A spot is now available for "Sold Out Festival"! You have 24 hours to complete your purchase before the spot is released.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: '10',
      type: 'system',
      title: 'Security Alert',
      message: 'New login detected from Windows PC in Ho Chi Minh City. If this wasn\'t you, please secure your account immediately.',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
  // Fetch notifications khi component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('[NotificationsPage] Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return <Ticket size={20} className="text-purple-600" />;
      case 'event':
        return <Calendar size={20} className="text-blue-600" />;
      case 'payment':
        return <CreditCard size={20} className="text-green-600" />;
      case 'system':
        return <AlertCircle size={20} className="text-orange-600" />;
    }
  };

  const markAsRead = async (id: string) => {
    const success = await notificationService.markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    const success = await notificationService.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const deleteAllRead = async () => {
    const readNotifications = notifications.filter(n => n.isRead);
    for (const notification of readNotifications) {
      await notificationService.deleteNotification(notification.id);
    }
    setNotifications(prev => prev.filter(n => !n.isRead));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type or actionUrl
    if (notification.actionUrl) {
      const route = notification.actionUrl.split('/')[1];
      const id = notification.actionUrl.split('/')[2];
      if (route === 'orders' || route === 'bookings') {
        onNavigate('my-tickets', id);
      } else if (route === 'events') {
        onNavigate('event-detail', id);
      } else {
        onNavigate(route, id);
      }
    } else {
      // Fallback navigation
      if (notification.type === 'booking') {
        onNavigate('my-tickets');
      } else if (notification.type === 'event') {
        onNavigate('home');
      } else if (notification.type === 'payment') {
        onNavigate('my-tickets');
      }
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread' && n.isRead) return false;
    if (activeType !== 'all' && n.type !== activeType) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    booking: notifications.filter(n => n.type === 'booking').length,
    event: notifications.filter(n => n.type === 'event').length,
    payment: notifications.filter(n => n.type === 'payment').length,
    system: notifications.filter(n => n.type === 'system').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="text-purple-600" size={32} />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <CheckCircle size={16} />
                Mark all as read
              </Button>
            )}
            {notifications.some(n => n.isRead) && (
              <Button
                onClick={deleteAllRead}
                variant="outline"
                size="sm"
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
                Clear read
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveType('all')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <Bell className="text-gray-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveType('booking')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.booking}</p>
                  <p className="text-xs text-gray-600">Bookings</p>
                </div>
                <Ticket className="text-purple-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveType('event')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.event}</p>
                  <p className="text-xs text-gray-600">Events</p>
                </div>
                <Calendar className="text-blue-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveType('payment')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.payment}</p>
                  <p className="text-xs text-gray-600">Payments</p>
                </div>
                <CreditCard className="text-green-400" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter size={20} />
                Filter Notifications
              </CardTitle>
              {activeType !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveType('all')}
                  className="text-purple-600"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Unread ({unreadCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-gray-500">
                <Loader2 size={32} className="mx-auto mb-4 animate-spin text-purple-600" />
                <p className="text-sm">Đang tải thông báo...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-purple-50/30 border-l-4 border-l-purple-500' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          notification.type === 'booking' ? 'bg-purple-100' :
                          notification.type === 'event' ? 'bg-blue-100' :
                          notification.type === 'payment' ? 'bg-green-100' :
                          'bg-orange-100'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <Badge className="bg-purple-600 text-white text-xs">New</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {notification.timestamp}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {notification.message}
                        </p>

                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="mt-3 text-purple-600 hover:text-purple-700 h-auto p-0"
                          >
                            <Check size={14} className="mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Bell size={64} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications found</h3>
                <p className="text-sm">
                  {activeFilter === 'unread' 
                    ? 'You have no unread notifications'
                    : activeType !== 'all'
                    ? `No ${activeType} notifications`
                    : 'You have no notifications at this time'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
