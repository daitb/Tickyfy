import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Users, Ticket, Calendar, Eye, Plus, Loader2 } from 'lucide-react';
import { organizerService, type OrganizerEventDto, type OrganizerEarningsDto } from '../services/organizerService';
import { authService } from '../services/authService';
import { mockOrders } from '../mockData';

interface OrganizerDashboardProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function OrganizerDashboard({ onNavigate }: OrganizerDashboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<OrganizerEventDto[]>([]);
  const [earnings, setEarnings] = useState<OrganizerEarningsDto | null>(null);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, draft, pending, approved, rejected

  const organizerId = authService.getCurrentOrganizerId();

  useEffect(() => {
    if (!organizerId) return;
    loadDashboardData(organizerId);
  }, [organizerId]);

  const loadDashboardData = async (currentOrganizerId: number) => {
    try {
      setIsLoading(true);
      setError('');

      // GET /api/organizers/{id}/events
      const eventsData = await organizerService.getOrganizerEvents(currentOrganizerId);
      setEvents(eventsData);

      // GET /api/organizers/{id}/earnings
      const earningsData = await organizerService.getOrganizerEarnings(currentOrganizerId);
      setEarnings(earningsData);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh dashboard data (called after creating/editing events)
  const refreshDashboard = () => {
    if (organizerId) {
      loadDashboardData(organizerId);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Filter events by status
  const filteredEvents = statusFilter === 'all' 
    ? events 
    : events.filter(e => e.status.toLowerCase() === statusFilter.toLowerCase());

  // Calculate stats from real data
  const totalRevenue = earnings?.totalRevenue || 0;
  const totalSold = events.reduce((sum, event) => sum + event.soldSeats, 0);
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'Approved').length;
  const pendingEvents = events.filter(e => e.status === 'Pending').length;

  // Format monthly revenue for chart
  const salesData = earnings?.monthlyRevenue || [];

  if (!organizerId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold mb-3">
            {t('organizer.accessRequiredTitle', 'Organizer access required')}
          </h1>
          <p className="text-neutral-600 mb-6">
            {t(
              'organizer.dashboard.accessRequiredDescription',
              'Please apply to become an organizer to view performance dashboards.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => onNavigate('home')} className="flex-1">
              {t('common.back')}
            </Button>
            <Button
              onClick={() => onNavigate('become-organizer')}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {t('organizer.becomeOrganizer')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="mb-2">{t('organizer.dashboard.title')}</h1>
            <p className="text-neutral-600">{t('organizer.dashboard.subtitle')}</p>
          </div>
          <Button
            onClick={() => onNavigate('create-event')}
            className="bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            <Plus size={20} className="mr-2" />
            {t('organizer.createNewEvent')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">{t('organizer.dashboard.overview')}</TabsTrigger>
            <TabsTrigger value="events">{t('organizer.dashboard.events')}</TabsTrigger>
            <TabsTrigger value="orders">{t('organizer.dashboard.orders')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('organizer.dashboard.analytics')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">{t('organizer.dashboard.totalRevenue')}</CardTitle>
                  <DollarSign className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{formatPrice(totalRevenue)}</div>
                  <p className="text-xs text-green-600 mt-1">
                    <TrendingUp size={12} className="inline mr-1" />
                    +12.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">Tickets Sold</CardTitle>
                  <Ticket className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{totalSold}</div>
                  <p className="text-xs text-green-600 mt-1">
                    <TrendingUp size={12} className="inline mr-1" />
                    +8.2% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">Active Events</CardTitle>
                  <Calendar className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{activeEvents}</div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {pendingEvents} pending approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">Total Views</CardTitle>
                  <Eye className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">12.4K</div>
                  <p className="text-xs text-green-600 mt-1">
                    <TrendingUp size={12} className="inline mr-1" />
                    +18.3% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Last 7 days ticket sales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'revenue') return formatPrice(value);
                        return value;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      name="Tickets"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Events */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Events</CardTitle>
                <CardDescription>Your best selling events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earnings?.topEvents && earnings.topEvents.length > 0 ? (
                    earnings.topEvents.map((event) => (
                      <div key={event.eventId} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                        <div className="flex-1">
                          <div className="text-neutral-900 mb-1">{event.title}</div>
                          <div className="text-sm text-neutral-500">
                            Top revenue generator
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-neutral-900">{formatPrice(event.revenue)}</div>
                          <div className="text-sm text-green-600">Revenue</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      No event data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Your Events</CardTitle>
                    <CardDescription>Manage and track all your events</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => onNavigate('create-event')}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus size={16} className="mr-2" />
                      New Event
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto text-neutral-300 mb-4" size={64} />
                    <h3 className="text-lg text-neutral-600 mb-2">
                      {statusFilter === 'all' 
                        ? 'No events yet' 
                        : `No ${statusFilter} events`}
                    </h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      {statusFilter === 'all'
                        ? 'Create your first event to get started'
                        : `You don't have any ${statusFilter} events at the moment`}
                    </p>
                    {statusFilter === 'all' && (
                      <Button
                        onClick={() => onNavigate('create-event')}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Plus size={16} className="mr-2" />
                        Create Your First Event
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredEvents.map((event) => {
                      const salesRate = event.totalSeats > 0 
                        ? ((event.soldSeats / event.totalSeats) * 100).toFixed(1) 
                        : '0';
                      
                      return (
                        <TableRow key={event.eventId}>
                          <TableCell>
                            <div>
                              <div className="text-neutral-900 font-medium">{event.title}</div>
                              <div className="text-sm text-neutral-500">ID: #{event.eventId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(event.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {new Date(event.startDate).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              event.status === 'Approved' ? 'bg-green-100 text-green-700' :
                              event.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              event.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-neutral-100 text-neutral-700'
                            }>
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{event.soldSeats} / {event.totalSeats}</span>
                              <span className="text-xs text-neutral-500">({salesRate}%)</span>
                            </div>
                            <div className="w-24 bg-neutral-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-orange-500 h-1.5 rounded-full"
                                style={{ width: `${salesRate}%` }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {(event.status === 'Draft' || event.status === 'Rejected') && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => onNavigate('edit-event', String(event.eventId))}
                                  className="text-blue-600 hover:bg-blue-50"
                                >
                                  Edit
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onNavigate('event-analytics', String(event.eventId))}
                                className="text-teal-600 hover:bg-teal-50"
                              >
                                Analytics
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onNavigate('event-detail', String(event.eventId))}
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Track customer purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrders.map((order) => {
                      const event = events.find(e => String(e.eventId) === order.eventId);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="text-neutral-900">{order.userName}</div>
                              <div className="text-sm text-neutral-500">{order.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>{event?.title || 'Unknown Event'}</TableCell>
                          <TableCell>{order.tickets.length}</TableCell>
                          <TableCell>{formatPrice(order.total)}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Event</CardTitle>
                  <CardDescription>Comparison of event performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={earnings?.topEvents || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatPrice(value)} />
                      <Bar dataKey="revenue" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ticket Sales Rate</CardTitle>
                  <CardDescription>Percentage of tickets sold</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event) => {
                      const salesRate = event.totalSeats > 0 
                        ? ((event.soldSeats / event.totalSeats) * 100).toFixed(1) 
                        : '0';
                      
                      return (
                        <div key={event.eventId}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-neutral-600">{event.title}</span>
                            <span className="text-sm">{salesRate}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all"
                              style={{ width: `${salesRate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}