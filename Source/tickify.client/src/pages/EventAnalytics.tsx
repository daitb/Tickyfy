import { useState } from 'react';
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
import { mockEvents } from '../mockData';

interface EventAnalyticsProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

type DateRange = '7days' | '30days' | 'all' | 'custom';

// Mock analytics data
const salesOverTimeData = [
  { date: 'Jan 1', revenue: 2400000, tickets: 24 },
  { date: 'Jan 2', revenue: 1398000, tickets: 14 },
  { date: 'Jan 3', revenue: 9800000, tickets: 98 },
  { date: 'Jan 4', revenue: 3908000, tickets: 39 },
  { date: 'Jan 5', revenue: 4800000, tickets: 48 },
  { date: 'Jan 6', revenue: 3800000, tickets: 38 },
  { date: 'Jan 7', revenue: 4300000, tickets: 43 },
];

const salesByTicketType = [
  { name: 'VIP', value: 150, percentage: 30, color: '#14b8a6' },
  { name: 'Standard', value: 250, percentage: 50, color: '#22c55e' },
  { name: 'Early Bird', value: 100, percentage: 20, color: '#10b981' },
];

const trafficSourcesData = [
  { source: 'Direct', visits: 3200 },
  { source: 'Social Media', visits: 2800 },
  { source: 'Email', visits: 1500 },
  { source: 'Search', visits: 1000 },
];

const topBuyers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', tickets: 10, spent: 5000000, date: '2025-01-10' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', tickets: 8, spent: 4000000, date: '2025-01-09' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', tickets: 6, spent: 3000000, date: '2025-01-08' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', tickets: 5, spent: 2500000, date: '2025-01-07' },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', tickets: 4, spent: 2000000, date: '2025-01-06' },
];

const recentTransactions = [
  { id: 'TRX-001', buyer: 'John Doe', amount: 500000, date: '2025-01-10 14:30', status: 'completed' },
  { id: 'TRX-002', buyer: 'Jane Smith', amount: 750000, date: '2025-01-10 13:15', status: 'completed' },
  { id: 'TRX-003', buyer: 'Bob Johnson', amount: 1000000, date: '2025-01-10 12:00', status: 'pending' },
  { id: 'TRX-004', buyer: 'Alice Williams', amount: 500000, date: '2025-01-10 10:45', status: 'completed' },
  { id: 'TRX-005', buyer: 'Charlie Brown', amount: 250000, date: '2025-01-10 09:30', status: 'failed' },
];

export function EventAnalytics({ eventId, onNavigate }: EventAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('7days');

  // Get event data
  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

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
    console.log('Exporting as:', format);
    // TODO: Implement export functionality
  };

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
              <div className="text-2xl text-neutral-900 mb-2">45,000,000₫</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp size={14} />
                <span>+12% from last period</span>
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
              <div className="text-2xl text-neutral-900 mb-2">450/500</div>
              <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: '90%' }} />
              </div>
              <div className="text-sm text-neutral-600">90% sold</div>
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
              <div className="text-2xl text-neutral-900 mb-2">8,234</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp size={14} />
                <span>+5%</span>
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
              <div className="text-2xl text-neutral-900 mb-2">5.4%</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp size={14} />
                <span>+0.8%</span>
              </div>
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
