import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  Ticket,
  Eye,
  Target,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  ArrowLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { eventService, type EventStatsDto } from '../services/eventService';

interface EventAnalyticsProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

type DateRange = '7days' | '30days' | 'all' | 'custom';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export function EventAnalytics({ eventId, onNavigate }: EventAnalyticsProps) {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<EventStatsDto | null>(null);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    if (eventId) {
      loadEventAnalytics();
    }
  }, [eventId]);

  const loadEventAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // GET /api/events/{id}/stats - Get event statistics
      const statsData = await eventService.getEventStatistics(Number(eventId));
      setStats(statsData);

      // Load basic event data
      const eventData = await eventService.getEventById(Number(eventId));
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleExport = (format: string) => {
    // TODO: Implement export functionality
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-4">Event analytics not found</p>
        <Button onClick={() => onNavigate('organizer-dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Map stats data to chart format
  const salesOverTimeData = stats.salesByDate?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.revenue,
    tickets: item.ticketsSold,
  })) || [];

  const salesByTicketType = stats.salesByTicketType?.map((item, index) => ({
    name: item.ticketTypeName,
    value: item.sold,
    percentage: stats.soldSeats ? Math.round((item.sold / stats.soldSeats) * 100) : 0,
    color: ['#14b8a6', '#22c55e', '#10b981', '#f59e0b', '#ef4444'][index % 5],
  })) || [];

  const trafficSourcesData = stats.trafficSources?.map((item) => ({
    source: item.sourceName,
    visits: item.visits,
  })) || [];

  const topBuyers = stats.topBuyers?.map((buyer) => ({
    id: buyer.userId.toString(),
    name: buyer.userName,
    email: buyer.email,
    tickets: buyer.ticketsPurchased,
    spent: buyer.totalSpent,
    date: new Date(buyer.lastPurchaseDate).toLocaleDateString(),
  })) || [];

  const recentTransactions = stats.recentTransactions?.map((txn) => ({
    id: txn.transactionId,
    buyer: txn.buyerName,
    amount: txn.amount,
    date: new Date(txn.transactionDate).toLocaleString(),
    status: txn.status.toLowerCase(),
  })) || [];

  const conversionRate = stats.totalSeats && stats.pageViews 
    ? ((stats.soldSeats / stats.pageViews) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
          <button onClick={() => onNavigate('event-management')} className="hover:text-teal-600">
            My Events
          </button>
          <ChevronRight size={16} />
          <button onClick={() => onNavigate('event-detail', event.id)} className="hover:text-teal-600">
            {event.title}
          </button>
          <ChevronRight size={16} />
          <span className="text-neutral-900">Analytics</span>
        </div>

        {/* Event Summary Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-20 h-20 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-neutral-900">{event.title}</h2>
                    <Badge className="bg-green-100 text-green-700">Published</Badge>
                  </div>
                  <div className="text-sm text-neutral-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>
                        {formatDate(event.date)} • {event.time}
                      </span>
                    </div>
                    <div>
                      {event.venue}, {event.city}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-teal-500 hover:bg-teal-600">
                      <Download size={16} className="mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <Download size={14} className="mr-2" />
                      PDF Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <Download size={14} className="mr-2" />
                      Excel Spreadsheet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <Download size={14} className="mr-2" />
                      CSV Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" onClick={() => onNavigate('event-management')}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Sales */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Total Sales</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {(stats.totalRevenue || 0).toLocaleString('vi-VN')}₫
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp size={14} />
                <span>+{stats.revenueGrowth?.toFixed(1) || '0.0'}% from last period</span>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Sold */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Tickets Sold</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Ticket className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {stats.soldSeats || 0}/{stats.totalSeats || 0}
              </div>
              <div className="text-sm text-neutral-600">
                {stats.totalSeats ? ((stats.soldSeats / stats.totalSeats) * 100).toFixed(1) : '0.0'}% capacity
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Conversion Rate</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Target className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">{conversionRate}%</div>
              <div className="text-sm text-neutral-600">
                {stats.soldSeats || 0} purchases from {stats.pageViews || 0} views
              </div>
            </CardContent>
          </Card>

          {/* Page Views */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Page Views</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Eye className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {(stats.pageViews || 0).toLocaleString()}
              </div>
              <div className="text-sm text-neutral-600">Total event page visits</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesOverTimeData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tickets Sold Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets Sold Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="tickets" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales by Ticket Type */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Ticket Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesByTicketType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${((value / salesByTicketType.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByTicketType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {salesByTicketType.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-neutral-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trafficSourcesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="source" type="category" stroke="#6b7280" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="visits" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Buyers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Buyers</CardTitle>
                <Button variant="link" className="text-teal-600">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topBuyers.slice(0, 5).map((buyer) => (
                    <TableRow key={buyer.id}>
                      <TableCell>
                        <div>
                          <div className="text-neutral-900">{buyer.name}</div>
                          <div className="text-sm text-neutral-500">{buyer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{buyer.tickets}</TableCell>
                      <TableCell className="text-right text-teal-600 hidden sm:table-cell">
                        {formatCurrency(buyer.spent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="link" className="text-teal-600">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="text-neutral-900">{transaction.id}</div>
                          <div className="text-sm text-neutral-500">{transaction.buyer}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
