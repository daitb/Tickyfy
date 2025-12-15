import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  Ticket,
  Eye,
  Target,
  TrendingUp,
  Download,
  Calendar,
  ArrowLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { eventService, type EventStatsDto } from "../services/eventService";

interface EventAnalyticsProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

type DateRange = "7days" | "30days" | "all" | "custom";

export function EventAnalytics({ eventId, onNavigate }: EventAnalyticsProps) {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>("7days");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<EventStatsDto | null>(null);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    if (eventId) {
      loadEventAnalytics();
    }
  }, [eventId]); // Backend API doesn't support date range filtering

  const loadEventAnalytics = async () => {
    try {
      setIsLoading(true);

      // GET /api/events/{id}/stats - Get event statistics
      const statsData = await eventService.getEventStatistics(Number(eventId));
      console.log("📊 Event Stats Data:", statsData);
      setStats(statsData);

      // Load basic event data
      const eventData = await eventService.getEventById(Number(eventId));
      console.log("🎫 Event Data:", eventData);
      setEvent(eventData);
    } catch (error) {
      console.error("❌ Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      const billions = amount / 1000000000;
      return billions % 1 === 0
        ? billions.toFixed(0) + "b"
        : billions.toFixed(1) + "b";
    } else if (amount >= 1000000) {
      const millions = amount / 1000000;
      return millions % 1 === 0
        ? millions.toFixed(0) + "m"
        : millions.toFixed(1) + "m";
    } else if (amount >= 1000) {
      const thousands = amount / 1000;
      return thousands % 1 === 0
        ? thousands.toFixed(0) + "k"
        : thousands.toFixed(1) + "k";
    }
    return amount.toString();
  };

  // Calculate smart Y-axis ticks with 5 segments closer to actual data
  const getYAxisTicks = (data: any[]) => {
    const revenues = data.map((d) => d.revenue || 0);
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
    return [
      0,
      niceInterval,
      niceInterval * 2,
      niceInterval * 3,
      niceInterval * 4,
    ];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        <Button onClick={() => onNavigate("organizer-dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Filter data based on selected date range
  const filterDataByDateRange = (salesByDate: any[]) => {
    if (!salesByDate || salesByDate.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        return salesByDate; // Return all data
      case "custom":
        // TODO: Implement custom date range picker
        return salesByDate;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return salesByDate.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  };

  // Map stats data to chart format with date range filter
  const filteredSalesByDate = filterDataByDateRange(stats.salesByDate || []);

  const salesOverTimeData = filteredSalesByDate.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: item.revenue,
    tickets: item.ticketsSold,
  }));

  // Calculate filtered metrics based on date range
  const filteredTotalRevenue = filteredSalesByDate.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const filteredTotalTickets = filteredSalesByDate.reduce(
    (sum, item) => sum + item.ticketsSold,
    0
  );

  // Use filtered data if date range is not 'all', otherwise use stats totals
  const displayRevenue =
    dateRange === "all" ? stats.totalRevenue : filteredTotalRevenue;
  const displayTicketsSold =
    dateRange === "all" ? stats.totalTicketsSold : filteredTotalTickets;

  console.log("📈 Sales Over Time Data (filtered):", salesOverTimeData);
  console.log("🎟️ Date Range:", dateRange);
  console.log("🗓️ Filtered Sales by Date:", filteredSalesByDate);
  console.log("💰 Display Metrics:", {
    displayRevenue,
    displayTicketsSold,
    avgTicketPrice:
      displayTicketsSold > 0 ? displayRevenue / displayTicketsSold : 0,
    dateRange,
    isFiltered: dateRange !== "all",
    originalRevenue: stats.totalRevenue,
    originalTickets: stats.totalTicketsSold,
  });

  // Filter topBuyers by date range
  const filterTransactionsByDateRange = (transactions: any[] | undefined) => {
    if (!transactions || dateRange === "all") return transactions || [];

    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return transactions;
    }

    return transactions.filter((item) => {
      const itemDate = new Date(item.lastPurchaseDate || item.transactionDate);
      return itemDate >= startDate;
    });
  };

  const topBuyers =
    filterTransactionsByDateRange(stats.topBuyers)?.map((buyer) => ({
      id: buyer.userId.toString(),
      name: buyer.userName,
      email: buyer.email,
      tickets: buyer.ticketsPurchased,
      spent: buyer.totalSpent,
      date: new Date(buyer.lastPurchaseDate).toLocaleDateString(),
    })) || [];

  const recentTransactions =
    filterTransactionsByDateRange(stats.recentTransactions)?.map((txn) => ({
      id: txn.transactionId,
      buyer: txn.buyerName,
      amount: txn.amount,
      date: new Date(txn.transactionDate).toLocaleString(),
      status: txn.status.toLowerCase(),
    })) || [];

  const conversionRate =
    stats.totalSeats && stats.pageViews
      ? ((stats.soldSeats / stats.pageViews) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
          <button
            onClick={() => onNavigate("event-management")}
            className="hover:text-teal-600"
          >
            {t("eventManagement.myEvents")}
          </button>
          <ChevronRight size={16} />
          <button
            onClick={() => onNavigate("event-detail", event.id)}
            className="hover:text-teal-600"
          >
            {event.title}
          </button>
          <ChevronRight size={16} />
          <span className="text-neutral-900">
            {t("eventAnalytics.analytics")}
          </span>
        </div>

        {/* Event Summary Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-20 h-20 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-neutral-900">{event.title}</h2>
                    <Badge className="bg-green-100 text-green-700">
                      {t("eventAnalytics.status.published")}
                    </Badge>
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
                <Select
                  value={dateRange}
                  onValueChange={(value: DateRange) => setDateRange(value)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder={t("eventAnalytics.dateRange")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">
                      {t("eventAnalytics.last7Days")}
                    </SelectItem>
                    <SelectItem value="30days">
                      {t("eventAnalytics.last30Days")}
                    </SelectItem>
                    <SelectItem value="all">
                      {t("eventAnalytics.allTime")}
                    </SelectItem>
                    <SelectItem value="custom">
                      {t("eventAnalytics.customRange")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-teal-500 hover:bg-teal-600">
                      <Download size={16} className="mr-2" />
                      {t("eventAnalytics.export")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <Download size={14} className="mr-2" />
                      {t("eventAnalytics.exportPdf")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                      <Download size={14} className="mr-2" />
                      {t("eventAnalytics.exportExcel")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      <Download size={14} className="mr-2" />
                      {t("eventAnalytics.exportCsv")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  onClick={() => onNavigate("event-management")}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  {t("common.back")}
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
                <div className="text-sm text-neutral-600">
                  {t("eventAnalytics.totalSales")}
                </div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {(displayRevenue || 0).toLocaleString("vi-VN")}₫
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp size={14} />
                <span>
                  +{stats.revenueGrowth?.toFixed(1) || "0.0"}%{" "}
                  {t("eventAnalytics.fromLastPeriod")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Sold */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">
                  {t("eventAnalytics.ticketsSold")}
                </div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Ticket className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {dateRange === "all"
                  ? `${stats.soldSeats || 0}/${stats.totalSeats || 0}`
                  : `${displayTicketsSold || 0}`}
              </div>
              <div className="text-sm text-neutral-600">
                {dateRange === "all"
                  ? `${
                      stats.totalSeats
                        ? ((stats.soldSeats / stats.totalSeats) * 100).toFixed(
                            1
                          )
                        : "0.0"
                    }% ${t("eventAnalytics.capacity")}`
                  : `${t("eventAnalytics.inSelectedPeriod")}`}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">
                  {t("eventAnalytics.conversionRate")}
                </div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Target className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {conversionRate}%
              </div>
              <div className="text-sm text-neutral-600">
                {stats.soldSeats || 0} {t("eventAnalytics.purchases")}{" "}
                {t("eventAnalytics.from")} {stats.pageViews || 0}{" "}
                {t("eventAnalytics.views")}
              </div>
            </CardContent>
          </Card>

          {/* Page Views */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">
                  {t("eventAnalytics.pageViews")}
                </div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Eye className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-2">
                {(stats.pageViews || 0).toLocaleString()}
              </div>
              <div className="text-sm text-neutral-600">
                {t("eventAnalytics.totalEventPageVisits")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart - Full Width */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("eventAnalytics.salesOverTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            {salesOverTimeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="text-neutral-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {t("eventAnalytics.noSalesData")}
                </h3>
                <p className="text-sm text-neutral-500 max-w-md">
                  {t("eventAnalytics.noSalesDataDescription")}
                </p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={salesOverTimeData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatCompactCurrency}
                  ticks={getYAxisTicks(salesOverTimeData)}
                  domain={[
                    0,
                    (dataMax: number) => {
                      const ticks = getYAxisTicks(salesOverTimeData);
                      return ticks[ticks.length - 1];
                    },
                  ]}
                  interval={0}
                  allowDataOverflow={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
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
            )}
          </CardContent>
        </Card>

        {/* Tickets & Sales Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tickets Sold Over Time */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("eventAnalytics.ticketsSoldOverTime")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Ticket className="text-green-600" size={16} />
                  <span className="text-lg font-semibold text-neutral-900">
                    {displayTicketsSold || 0}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {salesOverTimeData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <Ticket className="text-neutral-400" size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    {t("eventAnalytics.noTicketSalesData")}
                  </h3>
                  <p className="text-sm text-neutral-500 max-w-md">
                    {t("eventAnalytics.noTicketSalesDataDescription")}
                  </p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={salesOverTimeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                    cursor={{ fill: "rgba(20, 184, 166, 0.1)" }}
                  />
                  <Bar dataKey="tickets" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sales Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t("eventAnalytics.salesSummary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">
                      {t("eventAnalytics.ticketsSold")}
                    </span>
                    <span className="text-lg font-semibold">
                      {dateRange === "all"
                        ? stats.soldSeats || 0
                        : displayTicketsSold || 0}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          dateRange === "all" && stats.totalSeats
                            ? ((stats.soldSeats || 0) / stats.totalSeats) * 100
                            : filteredSalesByDate.length > 0
                            ? 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {dateRange === "all"
                      ? `${
                          stats.totalSeats
                            ? (
                                ((stats.soldSeats || 0) / stats.totalSeats) *
                                100
                              ).toFixed(1)
                            : 0
                        }% ${t("eventAnalytics.capacity")}`
                      : t("eventAnalytics.inSelectedPeriod")}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">
                      {t("eventAnalytics.averageTicketPrice")}
                    </span>
                    <span className="text-lg font-semibold text-teal-600">
                      {formatCurrency(
                        dateRange === "all"
                          ? stats.soldSeats && stats.soldSeats > 0
                            ? stats.totalRevenue / stats.soldSeats
                            : 0
                          : displayTicketsSold && displayTicketsSold > 0
                          ? displayRevenue / displayTicketsSold
                          : 0
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">
                      {t("eventAnalytics.conversionRate")}
                    </span>
                    <span className="text-lg font-semibold">
                      {conversionRate}%
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {dateRange === "all"
                      ? stats.soldSeats || 0
                      : displayTicketsSold || 0}{" "}
                    {t("eventAnalytics.purchases")} / {stats.pageViews || 0}{" "}
                    {t("eventAnalytics.views")}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">
                      {t("eventAnalytics.totalRevenue")}
                    </span>
                    <span className="text-xl font-bold text-teal-600">
                      {formatCurrency(displayRevenue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Buyers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("eventAnalytics.topBuyers")}</CardTitle>
                <Button variant="link" className="text-teal-600">
                  {t("common.viewAll")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topBuyers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                    <DollarSign className="text-neutral-400" size={24} />
                  </div>
                  <h3 className="text-base font-medium text-neutral-900 mb-1">
                    {t("eventAnalytics.noTopBuyers")}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {t("eventAnalytics.noTopBuyersDescription")}
                  </p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("eventAnalytics.name")}</TableHead>
                    <TableHead className="text-right">
                      {t("eventAnalytics.tickets")}
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      {t("eventAnalytics.spent")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topBuyers.slice(0, 5).map((buyer) => (
                    <TableRow key={buyer.id}>
                      <TableCell>
                        <div>
                          <div className="text-neutral-900">{buyer.name}</div>
                          <div className="text-sm text-neutral-500">
                            {buyer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {buyer.tickets}
                      </TableCell>
                      <TableCell className="text-right text-teal-600 hidden sm:table-cell">
                        {formatCurrency(buyer.spent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("eventAnalytics.recentTransactions")}</CardTitle>
                <Button variant="link" className="text-teal-600">
                  {t("common.viewAll")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                    <Ticket className="text-neutral-400" size={24} />
                  </div>
                  <h3 className="text-base font-medium text-neutral-900 mb-1">
                    {t("eventAnalytics.noTransactions")}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {t("eventAnalytics.noTransactionsDescription")}
                  </p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("eventAnalytics.transaction")}</TableHead>
                    <TableHead className="text-right">
                      {t("eventAnalytics.amount")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="text-neutral-900">
                            {transaction.id}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {transaction.buyer}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-teal-600">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
