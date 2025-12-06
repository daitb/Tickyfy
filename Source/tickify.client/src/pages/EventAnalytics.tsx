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

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      const billions = amount / 1000000000;
      return billions % 1 === 0 ? billions.toFixed(0) + 'b' : billions.toFixed(1) + 'b';
    } else if (amount >= 1000000) {
      const millions = amount / 1000000;
      return millions % 1 === 0 ? millions.toFixed(0) + 'm' : millions.toFixed(1) + 'm';
    } else if (amount >= 1000) {
      const thousands = amount / 1000;
      return thousands % 1 === 0 ? thousands.toFixed(0) + 'k' : thousands.toFixed(1) + 'k';
    }
    return amount.toString();
  };

  // Calculate smart Y-axis ticks with 5 segments closer to actual data
  const getYAxisTicks = (data: any[]) => {
    const revenues = data.map(d => d.revenue || 0);
    const maxRevenue = Math.max(...revenues, 0);
    
    if (maxRevenue === 0) return [0];
    
    // Calculate raw interval for 4 segments (5 ticks including 0)
    // Use 1.25x multiplier instead of direct division to get closer fit
    const rawInterval = (maxRevenue * 1.25) / 4;
    
    // Round to nice numbers
    let niceInterval;
    if (rawInterval <= 250000) {
      // Round to nearest 250k
      niceInterval = Math.ceil(rawInterval / 250000) * 250000;
    } else if (rawInterval <= 500000) {
      // Round to nearest 500k
      niceInterval = Math.ceil(rawInterval / 500000) * 500000;
    } else if (rawInterval <= 1000000) {
      // Round to nearest 1m
      niceInterval = Math.ceil(rawInterval / 1000000) * 1000000;
    } else if (rawInterval <= 1500000) {
      // Round to nearest 1.5m
      niceInterval = Math.ceil(rawInterval / 1500000) * 1500000;
    } else if (rawInterval <= 2000000) {
      // Round to nearest 2m
      niceInterval = Math.ceil(rawInterval / 2000000) * 2000000;
    } else if (rawInterval <= 2500000) {
      // Round to nearest 2.5m
      niceInterval = Math.ceil(rawInterval / 2500000) * 2500000;
    } else if (rawInterval <= 5000000) {
      // Round to nearest 5m
      niceInterval = Math.ceil(rawInterval / 5000000) * 5000000;
    } else if (rawInterval <= 10000000) {
      // Round to nearest 10m
      niceInterval = Math.ceil(rawInterval / 10000000) * 10000000;
    } else if (rawInterval <= 20000000) {
      // Round to nearest 20m
      niceInterval = Math.ceil(rawInterval / 20000000) * 20000000;
    } else if (rawInterval <= 25000000) {
      // Round to nearest 25m
      niceInterval = Math.ceil(rawInterval / 25000000) * 25000000;
    } else if (rawInterval <= 50000000) {
      // Round to nearest 50m
      niceInterval = Math.ceil(rawInterval / 50000000) * 50000000;
    } else if (rawInterval <= 100000000) {
      // Round to nearest 100m
      niceInterval = Math.ceil(rawInterval / 100000000) * 100000000;
    } else if (rawInterval <= 200000000) {
      // Round to nearest 200m
      niceInterval = Math.ceil(rawInterval / 200000000) * 200000000;
    } else if (rawInterval <= 250000000) {
      // Round to nearest 250m
      niceInterval = Math.ceil(rawInterval / 250000000) * 250000000;
    } else if (rawInterval <= 500000000) {
      // Round to nearest 500m
      niceInterval = Math.ceil(rawInterval / 500000000) * 500000000;
    } else {
      // Round to nearest 1b
      niceInterval = Math.ceil(rawInterval / 1000000000) * 1000000000;
    }
    
    // Generate exactly 5 ticks (0, 1x, 2x, 3x, 4x)
    return [0, niceInterval, niceInterval * 2, niceInterval * 3, niceInterval * 4];
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
        return <Badge className="bg-green-100 text-green-700">{t('eventAnalytics.status.completed')}</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700">{t('eventAnalytics.status.pending')}</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">{t('eventAnalytics.status.failed')}</Badge>;
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
            {t('eventManagement.myEvents')}
          </button>
          <ChevronRight size={16} />
          <button onClick={() => onNavigate('event-detail', event.id)} className="hover:text-teal-600">
            {event.title}
          </button>
          <ChevronRight size={16} />
          <span className="text-neutral-900">{t('eventAnalytics.analytics')}</span>
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
                    <Badge className="bg-green-100 text-green-700">{t('eventAnalytics.status.published')}</Badge>
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
                    <SelectValue placeholder={t('eventAnalytics.dateRange')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">{t('eventAnalytics.last7Days')}</SelectItem>
                    <SelectItem value="30days">{t('eventAnalytics.last30Days')}</SelectItem>
                    <SelectItem value="all">{t('eventAnalytics.allTime')}</SelectItem>
                    <SelectItem value="custom">{t('eventAnalytics.customRange')}</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-teal-500 hover:bg-teal-600">
                      <Download size={16} className="mr-2" />
                      {t('eventAnalytics.export')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <Download size={14} className="mr-2" />
                      {t('eventAnalytics.exportPdf')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <Download size={14} className="mr-2" />
                      {t('eventAnalytics.exportExcel')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <Download size={14} className="mr-2" />
                      {t('eventAnalytics.exportCsv')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" onClick={() => onNavigate('event-management')}>
                  <ArrowLeft size={16} className="mr-2" />
                  {t('common.back')}
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
                <div className="text-sm text-neutral-600">{t('eventAnalytics.totalSales')}</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {(stats.totalRevenue || 0).toLocaleString('vi-VN')}₫
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp size={14} />
                <span>+{stats.revenueGrowth?.toFixed(1) || '0.0'}% {t('eventAnalytics.fromLastPeriod')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Sold */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">{t('eventAnalytics.ticketsSold')}</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Ticket className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {stats.soldSeats || 0}/{stats.totalSeats || 0}
              </div>
              <div className="text-sm text-neutral-600">
                {stats.totalSeats ? ((stats.soldSeats / stats.totalSeats) * 100).toFixed(1) : '0.0'}% {t('eventAnalytics.capacity')}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">{t('eventAnalytics.conversionRate')}</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Target className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">{conversionRate}%</div>
              <div className="text-sm text-neutral-600">
                {stats.soldSeats || 0} {t('eventAnalytics.purchases')} {t('eventAnalytics.from')} {stats.pageViews || 0} {t('eventAnalytics.views')}
              </div>
            </CardContent>
          </Card>

          {/* Page Views */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">{t('eventAnalytics.pageViews')}</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Eye className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {(stats.pageViews || 0).toLocaleString()}
              </div>
              <div className="text-sm text-neutral-600">{t('eventAnalytics.totalEventPageVisits')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>{t('eventAnalytics.salesOverTime')}</CardTitle>
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
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12} 
                    tickFormatter={formatCompactCurrency}
                    ticks={getYAxisTicks(salesOverTimeData)}
                    domain={[0, (dataMax: number) => {
                      const ticks = getYAxisTicks(salesOverTimeData);
                      return ticks[ticks.length - 1];
                    }]}
                    interval={0}
                    allowDataOverflow={false}
                  />
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
              <CardTitle>{t('eventAnalytics.ticketsSoldOverTime')}</CardTitle>
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
              <CardTitle>{t('eventAnalytics.salesByTicketType')}</CardTitle>
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
              <CardTitle>{t('eventAnalytics.trafficSources')}</CardTitle>
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
                <CardTitle>{t('eventAnalytics.topBuyers')}</CardTitle>
                <Button variant="link" className="text-teal-600">
                  {t('common.viewAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('eventAnalytics.name')}</TableHead>
                    <TableHead className="text-right">{t('eventAnalytics.tickets')}</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">{t('eventAnalytics.spent')}</TableHead>
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
                <CardTitle>{t('eventAnalytics.recentTransactions')}</CardTitle>
                <Button variant="link" className="text-teal-600">
                  {t('common.viewAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('eventAnalytics.transaction')}</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">{t('eventAnalytics.amount')}</TableHead>
                    <TableHead className="text-right">{t('common.status')}</TableHead>
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
