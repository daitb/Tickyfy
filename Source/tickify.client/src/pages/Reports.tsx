import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Ticket, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function Reports() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('last6months');

  // Revenue trend data
  const revenueTrend = [
    { month: 'Jul', revenue: 45000000, tickets: 1200 },
    { month: 'Aug', revenue: 52000000, tickets: 1450 },
    { month: 'Sep', revenue: 48000000, tickets: 1380 },
    { month: 'Oct', revenue: 67000000, tickets: 1890 },
    { month: 'Nov', revenue: 89000000, tickets: 2340 },
    { month: 'Dec', revenue: 95000000, tickets: 2670 }
  ];

  // Category distribution
  const categoryData = [
    { name: 'Music', value: 35, color: '#f97316' },
    { name: 'Technology', value: 25, color: '#3b82f6' },
    { name: 'Sports', value: 20, color: '#10b981' },
    { name: 'Food & Drink', value: 12, color: '#f59e0b' },
    { name: 'Arts & Culture', value: 8, color: '#8b5cf6' }
  ];

  // Top events
  const topEvents = [
    { name: 'Summer Music Festival', revenue: 125000000, tickets: 5000 },
    { name: 'Tech Conference 2024', revenue: 89000000, tickets: 1200 },
    { name: 'Food & Wine Expo', revenue: 67000000, tickets: 2500 },
    { name: 'Marathon Championship', revenue: 54000000, tickets: 3000 },
    { name: 'Art Exhibition', revenue: 32000000, tickets: 800 }
  ];

  // User growth
  const userGrowth = [
    { month: 'Jul', users: 1200, organizers: 45 },
    { month: 'Aug', users: 1450, organizers: 52 },
    { month: 'Sep', users: 1680, organizers: 58 },
    { month: 'Oct', users: 2100, organizers: 67 },
    { month: 'Nov', users: 2580, organizers: 78 },
    { month: 'Dec', users: 3100, organizers: 89 }
  ];

  const stats = [
    {
      title: 'Total Revenue',
      value: '₫396,000,000',
      change: '+15.3%',
      trend: 'up',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      title: 'Total Tickets Sold',
      value: '10,930',
      change: '+23.1%',
      trend: 'up',
      icon: <Ticket className="w-5 h-5" />
    },
    {
      title: 'Active Users',
      value: '3,100',
      change: '+12.5%',
      trend: 'up',
      icon: <Users className="w-5 h-5" />
    },
    {
      title: 'Total Events',
      value: '247',
      change: '+8.2%',
      trend: 'up',
      icon: <Calendar className="w-5 h-5" />
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <div className="py-8 px-4 bg-background min-h-screen">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('admin.reports.title', 'Reports & Analytics')}</h1>
            <p className="text-muted-foreground">
              {t('admin.reports.subtitle', 'Platform performance and insights')}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last3months">Last 3 Months</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="lastyear">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="flex items-center gap-1 text-sm">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="topEvents">Top Events</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Sales</CardTitle>
                <CardDescription>Number of tickets sold per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tickets" fill="#3b82f6" name="Tickets Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Event Categories Distribution</CardTitle>
                <CardDescription>Percentage breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={120}
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
                  <div className="space-y-3">
                    {categoryData.map((category, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.value}% of events</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Growth in users and organizers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} name="Total Users" />
                    <Line type="monotone" dataKey="organizers" stroke="#f59e0b" strokeWidth={2} name="Organizers" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Events Tab */}
          <TabsContent value="topEvents">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Events</CardTitle>
                <CardDescription>Highest revenue generating events</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topEvents} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Reports;
