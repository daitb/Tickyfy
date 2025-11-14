import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Users, Ticket, Calendar, Eye, Plus } from 'lucide-react';
import { mockEvents, mockOrders } from '../mockData';

interface OrganizerDashboardProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function OrganizerDashboard({ onNavigate }: OrganizerDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const salesData = [
    { date: 'Oct 15', sales: 12, revenue: 6000000 },
    { date: 'Oct 16', sales: 19, revenue: 9500000 },
    { date: 'Oct 17', sales: 8, revenue: 4000000 },
    { date: 'Oct 18', sales: 15, revenue: 7500000 },
    { date: 'Oct 19', sales: 22, revenue: 11000000 },
    { date: 'Oct 20', sales: 28, revenue: 14000000 },
    { date: 'Oct 21', sales: 31, revenue: 15500000 }
  ];

  const eventStats = mockEvents.slice(0, 3).map(event => {
    const totalTickets = event.ticketTiers.reduce((sum, tier) => sum + tier.total, 0);
    const soldTickets = event.ticketTiers.reduce((sum, tier) => sum + (tier.total - tier.available), 0);
    const revenue = event.ticketTiers.reduce((sum, tier) => sum + (tier.price * (tier.total - tier.available)), 0);

    return {
      ...event,
      totalTickets,
      soldTickets,
      revenue,
      salesRate: ((soldTickets / totalTickets) * 100).toFixed(1)
    };
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const totalRevenue = eventStats.reduce((sum, event) => sum + event.revenue, 0);
  const totalSold = eventStats.reduce((sum, event) => sum + event.soldTickets, 0);
  const totalEvents = mockEvents.length;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="mb-2">Organizer Dashboard</h1>
            <p className="text-neutral-600">Manage your events and track performance</p>
          </div>
          <Button
            onClick={() => onNavigate('organizer-wizard')}
            className="bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            <Plus size={20} className="mr-2" />
            Create New Event
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">Total Revenue</CardTitle>
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
                  <div className="text-2xl">{totalEvents}</div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {totalEvents} published
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
                  {eventStats.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                      <div className="flex-1">
                        <div className="text-neutral-900 mb-1">{event.title}</div>
                        <div className="text-sm text-neutral-500">
                          {event.soldTickets} / {event.totalTickets} tickets sold ({event.salesRate}%)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-neutral-900">{formatPrice(event.revenue)}</div>
                        <div className="text-sm text-green-600">Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Your Events</CardTitle>
                <CardDescription>Manage and track all your events</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sold</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockEvents.map((event) => {
                      const totalTickets = event.ticketTiers.reduce((sum, tier) => sum + tier.total, 0);
                      const soldTickets = event.ticketTiers.reduce((sum, tier) => sum + (tier.total - tier.available), 0);
                      
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div>
                              <div className="text-neutral-900">{event.title}</div>
                              <div className="text-sm text-neutral-500">{event.category}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>{event.city}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {soldTickets} / {totalTickets}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onNavigate('seat-map-builder')}
                              >
                                Seats
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onNavigate('event-detail', event.id)}
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
                      const event = mockEvents.find(e => e.id === order.eventId);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="text-neutral-900">{order.userName}</div>
                              <div className="text-sm text-neutral-500">{order.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>{event?.title}</TableCell>
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
                    <BarChart data={eventStats}>
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
                    {eventStats.map((event) => (
                      <div key={event.id}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-neutral-600">{event.title}</span>
                          <span className="text-sm">{event.salesRate}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${event.salesRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
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