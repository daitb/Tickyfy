import { useState } from 'react';
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

interface NotificationsProps {
  onNavigate: (page: string) => void;
}

interface Notification {
  id: string;
  type: 'ticket' | 'event' | 'promo' | 'system' | 'payment';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLink?: string;
  actionText?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'ticket',
    title: 'Ticket purchased successfully',
    message: 'Your ticket for Summer Music Festival has been confirmed',
    timestamp: '2 hours ago',
    isRead: false,
    actionLink: 'my-tickets',
    actionText: 'View Ticket',
  },
  {
    id: '2',
    type: 'event',
    title: 'Event reminder',
    message: 'Summer Music Festival starts in 24 hours',
    timestamp: '3 hours ago',
    isRead: false,
    actionLink: 'event-detail',
    actionText: 'View Event',
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment received',
    message: 'You received 500,000 VND from ticket sales',
    timestamp: '5 hours ago',
    isRead: true,
  },
  {
    id: '4',
    type: 'promo',
    title: 'New promo code available',
    message: 'SUMMER50 - Get 50% off on selected events',
    timestamp: '1 day ago',
    isRead: true,
    actionLink: 'listing',
    actionText: 'Browse Events',
  },
  {
    id: '5',
    type: 'ticket',
    title: 'Ticket transfer accepted',
    message: 'John Doe has accepted your ticket transfer',
    timestamp: '2 days ago',
    isRead: true,
  },
  {
    id: '6',
    type: 'system',
    title: 'Password changed',
    message: 'Your password was successfully updated',
    timestamp: '3 days ago',
    isRead: true,
  },
  {
    id: '7',
    type: 'event',
    title: 'Event cancelled',
    message: 'Concert Night has been cancelled. Refund processed.',
    timestamp: '4 days ago',
    isRead: true,
  },
];

export function Notifications({ onNavigate }: NotificationsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'ticket':
        return <Ticket className={iconClass} />;
      case 'event':
        return <Calendar className={iconClass} />;
      case 'promo':
        return <Tag className={iconClass} />;
      case 'payment':
        return <DollarSign className={iconClass} />;
      case 'system':
        return <Bell className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'ticket':
        return 'bg-teal-100 text-teal-600';
      case 'event':
        return 'bg-green-100 text-green-600';
      case 'promo':
        return 'bg-purple-100 text-purple-600';
      case 'payment':
        return 'bg-blue-100 text-blue-600';
      case 'system':
        return 'bg-neutral-100 text-neutral-600';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const filterNotifications = (type?: string) => {
    if (!type || type === 'all') return notifications;
    if (type === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => n.type === type);
  };

  const filteredNotifications = filterNotifications(activeTab);

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const time = notification.timestamp;
      let group = 'Older';
      
      if (time.includes('hour')) group = 'Today';
      else if (time === '1 day ago') group = 'Yesterday';
      else if (time.includes('day') && parseInt(time) <= 7) group = 'This Week';

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
        {filteredNotifications.length === 0 ? (
          <Card className="p-16">
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
              <h3 className="text-neutral-900 mb-2">You're all caught up!</h3>
              <p className="text-neutral-600">No new notifications</p>
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
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.actionLink) {
                          onNavigate(notification.actionLink);
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
                            {notification.actionText && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-teal-600 p-0 h-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                  if (notification.actionLink) {
                                    onNavigate(notification.actionLink);
                                  }
                                }}
                              >
                                {notification.actionText} →
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

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-6">
            <Button variant="outline">Load More</Button>
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
