
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Shield, Users, Calendar, DollarSign, TrendingUp, TrendingDown, 
  Eye, AlertCircle, CheckCircle, XCircle, Search, Filter, Download, Settings,
  Clock, Loader2
} from 'lucide-react';
import { mockEvents, mockOrders } from '../mockData';
import { payoutService, type PayoutDto, type ApprovePayoutDto, type RejectPayoutDto } from '../services/payoutService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import apiClient from '../services/apiClient';
import { toast } from 'sonner';

interface AdminDashboardProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [organizerRequests, setOrganizerRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isApprovingEvent, setIsApprovingEvent] = useState<number | null>(null);
  const [isRejectingEvent, setIsRejectingEvent] = useState<number | null>(null);
  const [isApprovingRequest, setIsApprovingRequest] = useState<number | null>(null);

  // Calculate platform statistics
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
  const totalTicketsSold = mockOrders.reduce((sum, order) => sum + order.tickets.length, 0);
  const totalEvents = mockEvents.length;
  const activeEvents = mockEvents.filter(e => e.status === 'published').length;
  const totalOrganizers = 12; // Mock number
  const platformFees = totalRevenue * 0.05; // 5% platform fee

  // Revenue trend data
  const revenueTrend = [
    { month: 'Jul', revenue: 45000000, users: 120 },
    { month: 'Aug', revenue: 52000000, users: 145 },
    { month: 'Sep', revenue: 48000000, users: 138 },
    { month: 'Oct', revenue: 67000000, users: 189 },
    { month: 'Nov', revenue: 89000000, users: 234 },
    { month: 'Dec', revenue: 95000000, users: 267 }
  ];

  // Category distribution
  const categoryData = [
    { name: 'Music', value: 35, color: '#f97316' },
    { name: 'Sports', value: 25, color: '#3b82f6' },
    { name: 'Arts', value: 20, color: '#8b5cf6' },
    { name: 'Business', value: 12, color: '#10b981' },
    { name: 'Other', value: 8, color: '#6b7280' }
  ];

  // Mock user data
  const recentUsers = [
    { id: 1, name: 'Nguyen Van A', email: 'nguyenvana@email.com', joined: '2024-11-10', orders: 5, spent: 2500000 },
    { id: 2, name: 'Tran Thi B', email: 'tranthib@email.com', joined: '2024-11-09', orders: 3, spent: 1800000 },
    { id: 3, name: 'Le Van C', email: 'levanc@email.com', joined: '2024-11-08', orders: 7, spent: 4200000 },
    { id: 4, name: 'Pham Thi D', email: 'phamthid@email.com', joined: '2024-11-07', orders: 2, spent: 1200000 },
    { id: 5, name: 'Hoang Van E', email: 'hoangvane@email.com', joined: '2024-11-06', orders: 4, spent: 2800000 }
  ];

  // Mock organizer data
  const organizers = [
    { id: 1, name: 'LiveNation Vietnam', email: 'contact@livenation.vn', events: 12, revenue: 45000000, status: 'verified' },
    { id: 2, name: 'Music Hub', email: 'info@musichub.vn', events: 8, revenue: 28000000, status: 'verified' },
    { id: 3, name: 'Sports Events Pro', email: 'hello@sportsevents.vn', events: 5, revenue: 15000000, status: 'pending' },
    { id: 4, name: 'Art Gallery VN', email: 'contact@artgallery.vn', events: 3, revenue: 8500000, status: 'verified' },
    { id: 5, name: 'Conference Hub', email: 'info@conferencehub.vn', events: 6, revenue: 22000000, status: 'verified' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Load organizer requests
  useEffect(() => {
    if (activeTab === 'requests') {
      loadOrganizerRequests();
    } else if (activeTab === 'event-approvals') {
      loadPendingEvents();
    }
  }, [activeTab]);

  const loadOrganizerRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await apiClient.get('/admin/organizer-requests');
      let requests = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          requests = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          requests = response.data.data;
        }
      }
      
      setOrganizerRequests(requests);
    } catch (error: any) {
      console.error('Failed to load organizer requests:', error);
      toast.error('Không thể tải danh sách yêu cầu', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau',
        duration: 2000,
        closeButton: false,
      });
      setOrganizerRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      setIsApprovingRequest(requestId);
      await apiClient.post(`/admin/organizer-requests/${requestId}/approve`);
      toast.success('Đã phê duyệt yêu cầu thành công!', {
        duration: 2000,
        closeButton: false,
      });
      await loadOrganizerRequests();
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      toast.error('Không thể phê duyệt yêu cầu', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau',
        duration: 2000,
        closeButton: false,
      });
    } finally {
      setIsApprovingRequest(null);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      await apiClient.post(`/admin/organizer-requests/${selectedRequest.requestId}/reject`, {
        reviewNotes: rejectReason,
      });
      toast.success('Đã từ chối yêu cầu', {
        duration: 2000,
        closeButton: false,
      });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectReason('');
      await loadOrganizerRequests();
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      toast.error('Không thể từ chối yêu cầu', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau',
        duration: 2000,
        closeButton: false,
      });
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock size={12} className="mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const loadPendingEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const response = await apiClient.get('/admin/events/pending');
      let events = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          events = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          events = response.data.data;
        }
      }
      
      setPendingEvents(events);
    } catch (error: any) {
      console.error('Failed to load pending events:', error);
      toast.error('Không thể tải danh sách sự kiện chờ duyệt', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau',
        duration: 2000,
        closeButton: false,
      });
      setPendingEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleApproveEvent = async (eventId: number) => {
    try {
      setIsApprovingEvent(eventId);
      await apiClient.post(`/admin/events/${eventId}/approve`);
      toast.success('Đã phê duyệt sự kiện thành công!', {
        duration: 2000,
        closeButton: false,
      });
      await loadPendingEvents();
    } catch (error: any) {
      console.error('Failed to approve event:', error);
      toast.error('Không thể phê duyệt sự kiện', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau',
        duration: 2000,
        closeButton: false,
      });
    } finally {
      setIsApprovingEvent(null);
    }
  };

  const handleRejectEvent = async (eventId: number) => {
    try {
      setIsRejectingEvent(eventId);
      await apiClient.post(`/admin/events/${eventId}/reject`);
      toast.success('Đã từ chối sự kiện', {
        duration: 2000,
        closeButton: false,
      });
      await loadPendingEvents();
    } catch (error: any) {
      console.error('Failed to reject event:', error);
      toast.error('Không thể từ chối sự kiện', {
        description: error.response?.data?.message || 'Vui lòng thử lại sau',
        duration: 2000,
        closeButton: false,
      });
    } finally {
      setIsRejectingEvent(null);
    }
  };

  const getEventStatusBadge = (status: number) => {
    // EventStatus enum: 0=Pending, 1=Approved, 2=Rejected, 3=Published, 4=Cancelled, 5=Completed
    switch (status) {
      case 0:
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock size={12} className="mr-1" />
            Pending
          </Badge>
        );
      case 1:
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle size={12} className="mr-1" />
            Published
          </Badge>
        );
      case 4:
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <XCircle size={12} className="mr-1" />
            Cancelled
          </Badge>
        );
      case 5:
        return (
          <Badge className="bg-purple-100 text-purple-700">
            Completed
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-orange-500" size={32} />
              <h1>{t('admin.dashboard.title')}</h1>
            </div>
            <p className="text-neutral-600">{t('admin.dashboard.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              {t('admin.exportReport')}
            </Button>
            <Button variant="outline" size="sm">
              <Settings size={16} className="mr-2" />
              {t('common.settings')}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">{t('admin.overview')}</TabsTrigger>
            <TabsTrigger value="events">{t('header.events')}</TabsTrigger>
            <TabsTrigger value="event-approvals">{t('admin.eventApprovals', 'Event Approvals')}</TabsTrigger>
            <TabsTrigger value="organizers">{t('admin.organizer')}</TabsTrigger>
            <TabsTrigger value="requests">{t('admin.organizerRequests', 'Organizer Requests')}</TabsTrigger>
            <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
            <TabsTrigger value="payouts">{t('admin.payouts')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('organizer.analytics')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">{t('admin.totalRevenue')}</CardTitle>
                  <DollarSign className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{formatPrice(totalRevenue)}</div>
                  <p className="text-xs text-green-600 mt-1">
                    <TrendingUp size={12} className="inline mr-1" />
                    +23.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">{t('admin.platformFees')}</CardTitle>
                  <DollarSign className="text-green-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{formatPrice(platformFees)}</div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t('admin.commissionRate')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">{t('admin.totalEvents')}</CardTitle>
                  <Calendar className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{totalEvents}</div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {activeEvents} {t('admin.active')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">{t('admin.totalUsers')}</CardTitle>
                  <Users className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">1,247</div>
                  <p className="text-xs text-green-600 mt-1">
                    <TrendingUp size={12} className="inline mr-1" />
                    +12.3% this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.revenueTrend')}</CardTitle>
                  <CardDescription>{t('admin.monthlyRevenue')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatPrice(value)} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.eventsByCategory')}</CardTitle>
                  <CardDescription>{t('admin.categoryDistribution')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.recentUsers')}</CardTitle>
                <CardDescription>{t('admin.latestRegistrations')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.name')}</TableHead>
                      <TableHead>{t('admin.email')}</TableHead>
                      <TableHead>{t('admin.joined')}</TableHead>
                      <TableHead>{t('admin.orders')}</TableHead>
                      <TableHead className="text-right">{t('admin.totalSpent')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-neutral-900">{user.name}</TableCell>
                        <TableCell className="text-neutral-600">{user.email}</TableCell>
                        <TableCell>{new Date(user.joined).toLocaleDateString()}</TableCell>
                        <TableCell>{user.orders}</TableCell>
                        <TableCell className="text-right">{formatPrice(user.spent)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>{t('admin.allEvents')}</CardTitle>
                    <CardDescription>{t('admin.manageEvents')}</CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <Input
                        placeholder={t('admin.searchEvents')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
                        <SelectItem value="active">{t('admin.active')}</SelectItem>
                        <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                        <SelectItem value="suspended">{t('admin.suspended')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.event')}</TableHead>
                      <TableHead>{t('admin.organizer')}</TableHead>
                      <TableHead>{t('events.date')}</TableHead>
                      <TableHead>{t('events.category')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <div className="text-neutral-900">{event.title}</div>
                            <div className="text-sm text-neutral-500">{event.venue}</div>
                          </div>
                        </TableCell>
                        <TableCell>LiveNation VN</TableCell>
                        <TableCell>
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onNavigate('event-detail', event.id)}
                          >
                            {t('common.view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Approvals Tab */}
          <TabsContent value="event-approvals">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.eventApprovals', 'Event Approvals')}</CardTitle>
                <CardDescription>
                  {t('admin.reviewPendingEvents', 'Review and approve pending events from organizers')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-600">Loading pending events...</p>
                  </div>
                ) : pendingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-600">No pending events found</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-neutral-600">
                        Total: {pendingEvents.length} pending events
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>{t('admin.event', 'Event')}</TableHead>
                          <TableHead>{t('admin.organizer')}</TableHead>
                          <TableHead>{t('events.date')}</TableHead>
                          <TableHead>{t('events.category')}</TableHead>
                          <TableHead>{t('admin.status')}</TableHead>
                          <TableHead className="text-right">{t('admin.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingEvents.map((event: any) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">#{event.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-neutral-900">{event.title}</div>
                                <div className="text-sm text-neutral-500">{event.location}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {event.organizer?.companyName || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(event.startDate).toLocaleDateString('vi-VN')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{event.category?.name || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>{getEventStatusBadge(event.status)}</TableCell>
                            <TableCell className="text-right">
                              {event.status === 0 && ( // Pending status
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                    onClick={() => handleApproveEvent(event.id)}
                                    disabled={isApprovingEvent === event.id || isRejectingEvent === event.id}
                                  >
                                    {isApprovingEvent === event.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('admin.approving', 'Đang duyệt...')}
                                      </>
                                    ) : (
                                      t('admin.approve')
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => handleRejectEvent(event.id)}
                                    disabled={isApprovingEvent === event.id || isRejectingEvent === event.id}
                                  >
                                    {isRejectingEvent === event.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('admin.rejecting', 'Đang từ chối...')}
                                      </>
                                    ) : (
                                      t('admin.reject')
                                    )}
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizers Tab */}
          <TabsContent value="organizers">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.eventOrganizers')}</CardTitle>
                <CardDescription>{t('admin.manageOrganizers')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.organizer')}</TableHead>
                      <TableHead>{t('admin.email')}</TableHead>
                      <TableHead>{t('header.events')}</TableHead>
                      <TableHead>{t('organizer.revenue')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizers.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="text-neutral-900">{org.name}</TableCell>
                        <TableCell className="text-neutral-600">{org.email}</TableCell>
                        <TableCell>{org.events}</TableCell>
                        <TableCell>{formatPrice(org.revenue)}</TableCell>
                        <TableCell>
                          {org.status === 'verified' ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle size={12} className="mr-1" />
                              {t('admin.verified')}
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <AlertCircle size={12} className="mr-1" />
                              {t('admin.pending')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm">{t('common.edit')}</Button>
                            {org.status === 'pending' && (
                              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                {t('admin.approve')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizer Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.organizerRequests', 'Organizer Requests')}</CardTitle>
                <CardDescription>
                  {t('admin.reviewOrganizerRequests', 'Review and approve organizer registration requests')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-600">Loading requests...</p>
                  </div>
                ) : organizerRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-600">No organizer requests found</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-neutral-600">
                        Total: {organizerRequests.length} requests
                        {' | '}
                        Pending: {organizerRequests.filter(r => r.status.toLowerCase() === 'pending').length}
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>{t('admin.applicant', 'Applicant')}</TableHead>
                          <TableHead>{t('admin.organizationName', 'Organization')}</TableHead>
                          <TableHead>{t('admin.contactInfo', 'Contact')}</TableHead>
                          <TableHead>{t('admin.requestDate', 'Request Date')}</TableHead>
                          <TableHead>{t('admin.status')}</TableHead>
                          <TableHead className="text-right">{t('admin.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {organizerRequests.map((request) => (
                          <TableRow key={request.requestId}>
                            <TableCell className="font-medium">#{request.requestId}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-neutral-900">{request.user?.fullName}</div>
                                <div className="text-sm text-neutral-500">{request.user?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{request.organizationName}</div>
                                {request.businessRegistration && (
                                  <div className="text-sm text-neutral-500">
                                    Reg: {request.businessRegistration}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{request.phoneNumber}</div>
                                {request.address && (
                                  <div className="text-neutral-500 truncate max-w-[200px]">
                                    {request.address}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(request.requestedAt).toLocaleDateString('vi-VN')}
                            </TableCell>
                            <TableCell>{getRequestStatusBadge(request.status)}</TableCell>
                            <TableCell className="text-right">
                              {request.status.toLowerCase() === 'pending' && (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                    onClick={() => handleApproveRequest(request.requestId)}
                                    disabled={isApprovingRequest === request.requestId}
                                  >
                                    {isApprovingRequest === request.requestId ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('admin.approving', 'Đang duyệt...')}
                                      </>
                                    ) : (
                                      t('admin.approve')
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowRejectDialog(true);
                                    }}
                                    disabled={isApprovingRequest === request.requestId}
                                  >
                                    {t('admin.reject')}
                                  </Button>
                                </div>
                              )}
                              {request.status.toLowerCase() !== 'pending' && request.reviewNotes && (
                                <div className="text-xs text-neutral-500">
                                  {request.reviewNotes}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.platformUsers')}</CardTitle>
                <CardDescription>{t('admin.platformUsersDesc', 'Manage platform users and activity')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <Input
                      placeholder={t('admin.searchUsers')}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.user')}</TableHead>
                      <TableHead>{t('admin.email')}</TableHead>
                      <TableHead>{t('admin.joined')}</TableHead>
                      <TableHead>{t('admin.orders')}</TableHead>
                      <TableHead>{t('admin.totalSpent')}</TableHead>
                      <TableHead className="text-right">{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-neutral-900">{user.name}</TableCell>
                        <TableCell className="text-neutral-600">{user.email}</TableCell>
                        <TableCell>{new Date(user.joined).toLocaleDateString()}</TableCell>
                        <TableCell>{user.orders}</TableCell>
                        <TableCell>{formatPrice(user.spent)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">{t('common.view')}</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payout Management</CardTitle>
                <CardDescription>Review and approve organizer payout requests</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPayoutsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.userGrowth')}</CardTitle>
                  <CardDescription>{t('admin.monthlyRegistrations')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.platformHealth')}</CardTitle>
                  <CardDescription>{t('admin.keyMetrics')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <div className="text-sm text-neutral-600">{t('admin.uptime')}</div>
                        <div className="text-neutral-900">99.9%</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Eye className="text-blue-600" size={24} />
                      <div>
                        <div className="text-sm text-neutral-600">{t('admin.pageViews')}</div>
                        <div className="text-neutral-900">124.5K</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Users className="text-purple-600" size={24} />
                      <div>
                        <div className="text-sm text-neutral-600">{t('admin.conversionRate')}</div>
                        <div className="text-neutral-900">3.8%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Request Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.rejectRequest', 'Reject Organizer Request')}</DialogTitle>
            <DialogDescription>
              {t('admin.rejectRequestDesc', 'Please provide a reason for rejecting this request')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectReason">{t('admin.reason', 'Reason')} *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('admin.rejectReasonPlaceholder', 'Enter reason for rejection...')}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleRejectRequest}
              className="bg-red-500 hover:bg-red-600"
              disabled={!rejectReason.trim()}
            >
              {t('admin.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}

// Admin Payouts Management Component
function AdminPayoutsManagement() {
  const [payouts, setPayouts] = useState<PayoutDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutDto | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const data = await payoutService.getAllPayouts();
      setPayouts(data);
    } catch (err: any) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayout) return;
    try {
      const dto: ApprovePayoutDto = {
        notes: approveNotes,
        transactionId: transactionId || undefined,
      };
      await payoutService.approvePayout(selectedPayout.payoutId, dto);
      setShowApproveDialog(false);
      setSelectedPayout(null);
      setApproveNotes('');
      setTransactionId('');
      await loadPayouts();
    } catch (err: any) {
      console.error('Failed to approve payout:', err);
      alert(err.message || 'Failed to approve payout');
    }
  };

  const handleReject = async () => {
    if (!selectedPayout || !rejectReason) return;
    try {
      const dto: RejectPayoutDto = {
        reason: rejectReason,
        notes: '',
      };
      await payoutService.rejectPayout(selectedPayout.payoutId, dto);
      setShowRejectDialog(false);
      setSelectedPayout(null);
      setRejectReason('');
      await loadPayouts();
    } catch (err: any) {
      console.error('Failed to reject payout:', err);
      alert(err.message || 'Failed to reject payout');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock size={12} className="mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle size={12} className="mr-1" />
            Processed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading payouts...</div>;
  }

  const pendingPayouts = payouts.filter(p => p.status.toLowerCase() === 'pending');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-600">Total Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{payouts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600">{pendingPayouts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatPrice(payouts.reduce((sum, p) => sum + p.amount, 0))}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Organizer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                No payout requests
              </TableCell>
            </TableRow>
          ) : (
            payouts.map((payout) => (
              <TableRow key={payout.payoutId}>
                <TableCell className="font-medium">#{payout.payoutId}</TableCell>
                <TableCell>{payout.organizerName}</TableCell>
                <TableCell>{formatPrice(payout.amount)}</TableCell>
                <TableCell>{getStatusBadge(payout.status)}</TableCell>
                <TableCell>
                  {new Date(payout.requestedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {payout.status.toLowerCase() === 'pending' && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowApproveDialog(true);
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowRejectDialog(true);
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout</DialogTitle>
            <DialogDescription>
              Approve payout request #{selectedPayout?.payoutId} for {formatPrice(selectedPayout?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Bank transfer transaction ID"
              />
            </div>
            <div>
              <Label htmlFor="approveNotes">Notes (Optional)</Label>
              <Textarea
                id="approveNotes"
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-500 hover:bg-green-600">
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout</DialogTitle>
            <DialogDescription>
              Reject payout request #{selectedPayout?.payoutId} for {formatPrice(selectedPayout?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectReason">Reason *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              className="bg-red-500 hover:bg-red-600"
              disabled={!rejectReason}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
