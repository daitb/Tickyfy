import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Ticket,
  Calendar,
  Tag,
  ShoppingCart,
  DollarSign,
  Star,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRightLeft,
  MoreVertical,
  Settings,
  CheckCheck,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import notificationService, { type Notification } from '../services/notificationService';

interface NotificationsProps {
  onNavigate: (page: string, id?: string) => void;
}

export function Notifications({ onNavigate }: NotificationsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications khi component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await notificationService.getNotifications(
        page,
        pageSize,
        activeTab !== 'all' && activeTab !== 'unread' ? activeTab : undefined,
        activeTab === 'unread' ? false : undefined
      );
      setNotifications(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('[Notifications] Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch lại khi page hoặc activeTab thay đổi
  useEffect(() => {
    fetchNotifications();
  }, [page, activeTab]);

  const getIcon = (type: Notification['type']) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'booking':
      case 'ticket':
        return <Ticket className={iconClass} />;
      case 'event':
        return <Calendar className={iconClass} />;
      case 'payment':
        return <DollarSign className={iconClass} />;
      case 'system':
        return <Bell className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
      case 'ticket':
        return 'bg-teal-100 text-teal-600';
      case 'event':
        return 'bg-green-100 text-green-600';
      case 'payment':
        return 'bg-blue-100 text-blue-600';
      case 'system':
        return 'bg-neutral-100 text-neutral-600';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const markAsRead = async (id: string) => {
    const success = await notificationService.markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    const success = await notificationService.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter((n) => n.id !== id));
    }
  };

  const filterNotifications = (type?: string) => {
    if (!type || type === 'all') return notifications;
    if (type === 'unread') return notifications.filter((n) => !n.isRead);
    // Map frontend types to match filter tabs
    const typeMap: Record<string, Notification['type']> = {
      'ticket': 'ticket',
      'event': 'event',
      'promo': 'event', // Promo notifications map to event type
      'payment': 'payment',
      'system': 'system',
    };
    const mappedType = typeMap[type] || type as Notification['type'];
    return notifications.filter((n) => n.type === mappedType);
  };

  const filteredNotifications = filterNotifications(activeTab);

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const time = notification.timestamp.toLowerCase();
      let group = 'Cũ hơn';
      
      if (time.includes('vừa xong') || time.includes('phút') || time.includes('giờ')) {
        group = 'Hôm nay';
      } else if (time.includes('hôm qua') || time.includes('ngày') && time.includes('1')) {
        group = 'Hôm qua';
      } else if (time.includes('ngày') || time.includes('tuần')) {
        const dayMatch = time.match(/(\d+)/);
        if (dayMatch && parseInt(dayMatch[1]) <= 7) {
          group = 'Tuần này';
        }
      }

      if (!groups[group]) groups[group] = [];
      groups[group].push(notification);
      return groups;
    },
    {} as Record<string, Notification[]>
  );

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1>Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-teal-500">{unreadCount} unread</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck size={16} className="mr-2" />
              Mark All Read
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings size={16} className="mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="all">
              All {notifications.length > 0 && `(${notifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="ticket">Tickets</TabsTrigger>
            <TabsTrigger value="event">Events</TabsTrigger>
            <TabsTrigger value="promo">Promos</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        {isLoading ? (
          <Card className="p-16">
            <div className="text-center">
              <Loader2 className="mx-auto text-teal-500 mb-4 animate-spin" size={48} />
              <h3 className="text-neutral-900 mb-2">Đang tải thông báo...</h3>
            </div>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-16">
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
              <h3 className="text-neutral-900 mb-2">Bạn đã xem hết!</h3>
              <p className="text-neutral-600">Không có thông báo mới</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group}>
                <h3 className="text-sm text-neutral-600 mb-3">{group}</h3>
                <div className="space-y-2">
                  {items.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`relative cursor-pointer transition-all hover:shadow-md ${
                        !notification.isRead ? 'bg-teal-50 border-teal-200' : ''
                      }`}
                      onClick={async () => {
                        if (!notification.isRead) {
                          await markAsRead(notification.id);
                        }
                        if (notification.actionUrl) {
                          const route = notification.actionUrl.split('/')[1];
                          const id = notification.actionUrl.split('/')[2];
                          if (route === 'orders' || route === 'bookings') {
                            onNavigate('my-tickets');
                          } else if (route === 'events') {
                            onNavigate('event-detail', id);
                          } else {
                            onNavigate(route, id);
                          }
                        }
                      }}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-l" />
                      )}
                      
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm text-neutral-900">
                                {notification.title}
                              </h4>
                              <span className="text-xs text-neutral-500 whitespace-nowrap">
                                {notification.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-600 mb-2">
                              {notification.message}
                            </p>
                            {notification.actionUrl && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-teal-600 p-0 h-auto"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!notification.isRead) {
                                    await markAsRead(notification.id);
                                  }
                                  const route = notification.actionUrl?.split('/')[1];
                                  const id = notification.actionUrl?.split('/')[2];
                                  if (route === 'orders' || route === 'bookings') {
                                    onNavigate('my-tickets');
                                  } else if (route === 'events') {
                                    onNavigate('event-detail', id);
                                  } else if (route) {
                                    onNavigate(route, id);
                                  }
                                }}
                              >
                                Xem chi tiết →
                              </Button>
                            )}
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                {notification.isRead ? 'Mark as Unread' : 'Mark as Read'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredNotifications.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-neutral-600">
              Hiển thị {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalCount)} trong tổng số {totalCount} thông báo
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || isLoading}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Manage how you receive notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Email Notifications */}
            <div>
              <h4 className="text-sm text-neutral-900 mb-3">Email Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ticket purchases</Label>
                    <p className="text-xs text-neutral-500">When you buy or receive tickets</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Event reminders</Label>
                    <p className="text-xs text-neutral-500">24h and 1h before events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ticket transfers</Label>
                    <p className="text-xs text-neutral-500">Transfer requests and confirmations</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment confirmations</Label>
                    <p className="text-xs text-neutral-500">Payment receipts and refunds</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Event updates</Label>
                    <p className="text-xs text-neutral-500">Changes to events you're attending</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Promotional offers</Label>
                    <p className="text-xs text-neutral-500">Deals and promo codes</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            {/* Push Notifications */}
            <div className="pt-4 border-t">
              <h4 className="text-sm text-neutral-900 mb-3">Push Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable push notifications</Label>
                    <p className="text-xs text-neutral-500">Receive alerts on your device</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* Organizer Settings */}
            <div className="pt-4 border-t">
              <h4 className="text-sm text-neutral-900 mb-3">Organizer Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New ticket sales</Label>
                    <p className="text-xs text-neutral-500">When someone buys tickets</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low inventory alerts</Label>
                    <p className="text-xs text-neutral-500">When tickets are running low</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment notifications</Label>
                    <p className="text-xs text-neutral-500">Payment received confirmations</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics digest</Label>
                    <p className="text-xs text-neutral-500">Weekly performance summary</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-500 hover:bg-teal-600" onClick={() => setShowSettings(false)}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
