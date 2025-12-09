import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Ticket,
  Calendar,
  Eye,
  Plus,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  organizerService,
  type OrganizerEventDto,
  type OrganizerEarningsDto,
  type OrganizerBookingDto,
} from "../services/organizerService";
import { authService } from "../services/authService";

interface OrganizerDashboardProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function OrganizerDashboard({ onNavigate }: OrganizerDashboardProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<OrganizerEventDto[]>([]);
  const [earnings, setEarnings] = useState<OrganizerEarningsDto | null>(null);
  const [bookings, setBookings] = useState<OrganizerBookingDto[]>([]);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, draft, pending, approved, rejected
  
  // Search and filter states
  const [eventSearchTerm, setEventSearchTerm] = useState("");
  const [eventDateFilter, setEventDateFilter] = useState("all");
  const [chartDateFilter, setChartDateFilter] = useState("all"); // For Sales Trend chart only
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderDateFilter, setOrderDateFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  
  // Pagination states
  const [eventsPage, setEventsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const itemsPerPage = 10;

  const organizerId = authService.getCurrentOrganizerId();

  // Initial load
  useEffect(() => {
    if (!organizerId) return;
    loadDashboardData(organizerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizerId]);

  // Refresh when tab becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && organizerId) {
        loadDashboardData(organizerId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [organizerId]);

  const loadDashboardData = async (targetOrganizerId?: number) => {
    try {
      const effectiveOrganizerId = targetOrganizerId ?? organizerId;
      if (!effectiveOrganizerId) return;

      setIsLoading(true);
      setError("");

      // GET /api/organizers/{id}/events
      const eventsData = await organizerService.getOrganizerEvents(
        effectiveOrganizerId
      );
      setEvents(eventsData);

      // GET /api/organizers/{id}/earnings
      const earningsData = await organizerService.getOrganizerEarnings(
        effectiveOrganizerId
      );
      setEarnings(earningsData);

      // GET /api/organizers/{id}/bookings
      const bookingsData = await organizerService.getOrganizerBookings(
        effectiveOrganizerId
      );
      setBookings(bookingsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh dashboard data (called after creating/editing events)
  const _refreshDashboard = () => {
    if (organizerId) {
      loadDashboardData(organizerId);
    }
  };

  const formatPrice = (price: number) => {
    const isVietnamese = i18n.language === 'vi';
    
    if (isVietnamese) {
      // Tiếng Việt: 10.000 ₫
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price);
    } else {
      // Tiếng Anh: 10,000 VND
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price) + ' VND';
    }
  };

  const formatCompactPrice = (price: number) => {
    const isVietnamese = i18n.language === 'vi';
    
    if (isVietnamese) {
      // Tiếng Việt: tr, tỷ
      if (price >= 1000000000) {
        const billions = price / 1000000000;
        return (billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)) + 'tỷ ₫';
      } else if (price >= 1000000) {
        const millions = price / 1000000;
        return (millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)) + 'tr ₫';
      } else if (price >= 1000) {
        const thousands = price / 1000;
        return (thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)) + 'k ₫';
      }
      return price.toString() + ' ₫';
    } else {
      // Tiếng Anh: M, B
      if (price >= 1000000000) {
        const billions = price / 1000000000;
        return (billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)) + 'B VND';
      } else if (price >= 1000000) {
        const millions = price / 1000000;
        return (millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)) + 'M VND';
      } else if (price >= 1000) {
        const thousands = price / 1000;
        return (thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)) + 'K VND';
      }
      return price.toString() + ' VND';
    }
  };

  // Calculate smart Y-axis ticks with 5 segments closer to actual data
  const getYAxisTicks = () => {
    const revenues = salesData.map(d => d.revenue || 0);
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

  // Filter events by status, search, and date
  const filteredEvents = events.filter((event) => {
    // Status filter
    const matchesStatus = statusFilter === "all" || 
      event.status.toLowerCase() === statusFilter.toLowerCase();
    
    // Search filter
    const matchesSearch = !eventSearchTerm || 
      event.title?.toLowerCase().includes(eventSearchTerm.toLowerCase());
    
    // Date filter logic
    let matchesDate = true;
    if (eventDateFilter !== "all" && event.startDate) {
      const eventDate = new Date(event.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (eventDateFilter) {
        case "today":
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          matchesDate = eventDate >= today && eventDate <= todayEnd;
          break;
        case "thisWeek":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          matchesDate = eventDate >= weekStart && eventDate <= weekEnd;
          break;
        case "thisMonth":
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          matchesDate = eventDate >= monthStart && eventDate <= monthEnd;
          break;
        case "upcoming":
          matchesDate = eventDate >= today;
          break;
        case "past":
          matchesDate = eventDate < today;
          break;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Filter bookings by search, date, and status
  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    const matchesSearch = !orderSearchTerm || 
      booking.bookingCode?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      booking.customerName?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      booking.customerEmail?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      booking.eventTitle?.toLowerCase().includes(orderSearchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = orderStatusFilter === "all" || 
      booking.status.toLowerCase() === orderStatusFilter.toLowerCase();
    
    // Date filter logic
    let matchesDate = true;
    if (orderDateFilter !== "all" && booking.bookingDate) {
      const bookingDate = new Date(booking.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (orderDateFilter) {
        case "today":
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          matchesDate = bookingDate >= today && bookingDate <= todayEnd;
          break;
        case "thisWeek":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          matchesDate = bookingDate >= weekStart && bookingDate <= weekEnd;
          break;
        case "thisMonth":
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          matchesDate = bookingDate >= monthStart && bookingDate <= monthEnd;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate stats from real data (all time)
  const totalRevenue = earnings?.totalRevenue || 0;
  const totalSold = events.reduce((sum, event) => sum + event.soldSeats, 0);
  const _totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === "Approved").length;
  const pendingEvents = events.filter((e) => e.status === "Pending").length;
  const ongoingEvents = events.filter((e) => e.status === "Approved" || e.status === "Published").length;

  // Calculate revenue growth (mock calculation - should come from API)
  const revenueGrowth = earnings?.monthlyRevenue && earnings.monthlyRevenue.length >= 2 
    ? {
        isPositive: (earnings.monthlyRevenue[earnings.monthlyRevenue.length - 1]?.revenue || 0) >= 
                   (earnings.monthlyRevenue[earnings.monthlyRevenue.length - 2]?.revenue || 0),
        percentage: earnings.monthlyRevenue.length >= 2
          ? Math.abs(
              ((earnings.monthlyRevenue[earnings.monthlyRevenue.length - 1]?.revenue || 0) - 
               (earnings.monthlyRevenue[earnings.monthlyRevenue.length - 2]?.revenue || 0)) / 
              (earnings.monthlyRevenue[earnings.monthlyRevenue.length - 2]?.revenue || 1) * 100
            ).toFixed(1)
          : '0.0'
      }
    : null;

  // Calculate tickets sold growth from monthly data
  const ticketsSoldGrowth = earnings?.monthlyRevenue && earnings.monthlyRevenue.length >= 2
    ? {
        isPositive: (earnings.monthlyRevenue[earnings.monthlyRevenue.length - 1]?.ticketsSold || 0) >= 
                   (earnings.monthlyRevenue[earnings.monthlyRevenue.length - 2]?.ticketsSold || 0),
        percentage: earnings.monthlyRevenue.length >= 2
          ? Math.abs(
              ((earnings.monthlyRevenue[earnings.monthlyRevenue.length - 1]?.ticketsSold || 0) - 
               (earnings.monthlyRevenue[earnings.monthlyRevenue.length - 2]?.ticketsSold || 0)) / 
              (earnings.monthlyRevenue[earnings.monthlyRevenue.length - 2]?.ticketsSold || 1) * 100
            ).toFixed(1)
          : '0.0'
      }
    : null;

  // Format monthly revenue for chart
  const salesData = earnings?.monthlyRevenue || [];
  
  // Filter salesData based on chartDateFilter for Sales Trend chart
  const getFilteredSalesData = () => {
    if (chartDateFilter === "all") return salesData;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    return salesData.filter((item) => {
      // Parse month string (e.g., "Jan 2024" or "Tháng 1, 2024")
      const monthMatch = item.month.match(/(\d+)/); // Extract year
      if (!monthMatch) return false;
      
      const year = parseInt(monthMatch[0]);
      
      // Get month index from month name
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const viMonthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
      
      let monthIndex = monthNames.findIndex(m => item.month.includes(m));
      if (monthIndex === -1) {
        monthIndex = viMonthNames.findIndex(m => item.month.includes(m));
      }
      
      if (monthIndex === -1) return false;
      
      switch (chartDateFilter) {
        case "thisMonth": // This Month
          return year === currentYear && monthIndex === currentMonth;
        case "lastMonth": // Last Month
          const lastMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return year === lastMonthYear && monthIndex === lastMonthIndex;
        default:
          return true;
      }
    });
  };
  
  // Format month labels based on language
  const formatMonthLabel = (monthStr: string): string => {
    const isVietnamese = i18n.language === 'vi';
    
    // Parse "Jan 2025" or "Feb 2025" format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearMatch = monthStr.match(/(\d{4})/);
    if (!yearMatch) return monthStr;
    
    const year = yearMatch[0];
    const monthIndex = monthNames.findIndex(m => monthStr.includes(m));
    
    if (monthIndex === -1) return monthStr;
    
    if (isVietnamese) {
      // Format as T1-2025, T2-2025, etc.
      return `T${monthIndex + 1}-${year}`;
    } else {
      // Keep as Jan 2025, Feb 2025, etc.
      return monthStr;
    }
  };
  
  const filteredSalesData = getFilteredSalesData().map(item => ({
    ...item,
    month: formatMonthLabel(item.month)
  }));

  if (!organizerId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold mb-3">
            {t("organizer.accessRequiredTitle", "Organizer access required")}
          </h1>
          <p className="text-neutral-600 mb-6">
            {t(
              "organizer.dashboard.accessRequiredDescription",
              "Please apply to become an organizer to view performance dashboards."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => onNavigate("home")}
              className="flex-1"
            >
              {t("common.back")}
            </Button>
            <Button
              onClick={() => onNavigate("become-organizer")}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {t("organizer.becomeOrganizer")}
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
          <Button onClick={() => loadDashboardData()} disabled={!organizerId}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="mb-2">{t("organizer.dashboard.title")}</h1>
            <p className="text-neutral-600">
              {t("organizer.dashboard.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => onNavigate("create-event")}
            className="bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            <Plus size={20} className="mr-2" />
            {t("organizer.createNewEvent")}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">
              {t("organizer.dashboard.overview")}
            </TabsTrigger>
            <TabsTrigger value="events">
              {t("organizer.dashboard.events")}
            </TabsTrigger>
            <TabsTrigger value="orders">
              {t("organizer.dashboard.orders")}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              {t("organizer.dashboard.analytics")}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">
                    {t("organizer.dashboard.totalRevenue")}
                  </CardTitle>
                  <DollarSign className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{formatPrice(totalRevenue)}</div>
                  {revenueGrowth ? (
                    <p className={`text-xs mt-1 ${revenueGrowth.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      <TrendingUp size={12} className="inline mr-1" />
                      {revenueGrowth.isPositive ? '+' : ''}{revenueGrowth.percentage}% {t('organizer.dashboard.fromLastMonth', 'from last month')}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500 mt-1">
                      {t('organizer.dashboard.netEarnings', 'Net earnings')}: {formatPrice(earnings?.netEarnings || 0)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">
                    {t("organizer.dashboard.ticketsSold", "Tickets Sold")}
                  </CardTitle>
                  <Ticket className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{totalSold}</div>
                  {ticketsSoldGrowth ? (
                    <p className={`text-xs mt-1 ${
                      ticketsSoldGrowth.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp size={12} className="inline mr-1" />
                      {ticketsSoldGrowth.isPositive ? '+' : ''}{ticketsSoldGrowth.percentage}% {t('organizer.dashboard.fromLastMonth', 'from last month')}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500 mt-1">
                      {t('organizer.dashboard.totalTicketsSold', 'Total tickets sold')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">
                    {t("organizer.dashboard.activeEvents", "Active Events")}
                  </CardTitle>
                  <Calendar className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{ongoingEvents}</div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {pendingEvents}{" "}
                    {t(
                      "organizer.dashboard.pendingApproval",
                      "pending approval"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">
                    {t("organizer.dashboard.availableBalance", "Available Balance")}
                  </CardTitle>
                  <DollarSign className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{formatPrice(earnings?.availableBalance || 0)}</div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t(
                      "organizer.dashboard.readyForPayout",
                      "Ready for payout"
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Total Views - Hidden until API is ready
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-600">
                    {t("organizer.dashboard.totalViews", "Total Views")}
                  </CardTitle>
                  <Eye className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">12.4K</div>
                  <p className="text-xs text-green-600 mt-1">
                    <TrendingUp size={12} className="inline mr-1" />
                    {t(
                      "organizer.dashboard.viewsIncrease",
                      "+18.3% from last month"
                    )}
                  </p>
                </CardContent>
              </Card>
              */}
            </div>

            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {t("organizer.dashboard.salesTrend", "Sales Trend")}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        "organizer.dashboard.monthlyRevenue",
                        "Monthly revenue performance"
                      )}
                    </CardDescription>
                  </div>
                  <Select value={chartDateFilter} onValueChange={setChartDateFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("organizer.dashboard.allTime", "All Time")}
                      </SelectItem>
                      <SelectItem value="thisMonth">
                        {t("organizer.dashboard.thisMonth", "This Month")}
                      </SelectItem>
                      <SelectItem value="lastMonth">
                        {t("organizer.dashboard.lastMonth", "Last Month")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredSalesData && filteredSalesData.length > 0 && filteredSalesData.some(d => d.revenue > 0) ? (
                <div className="pr-8">
                  <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={filteredSalesData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      width={80}
                      tickFormatter={(value) => {
                        const isVietnamese = i18n.language === 'vi';
                        if (isVietnamese) {
                          // Tiếng Việt: 380tr ₫
                          if (value < 1000) {
                            return value + "₫";
                          } else if (value < 1000000) {
                            return (value / 1000).toFixed(0) + "k ₫";
                          } else if (value < 1000000000) {
                            return (value / 1000000).toFixed(1).replace(".0", "") + "tr ₫";
                          } else {
                            return (value / 1000000000).toFixed(1).replace(".0", "") + "tỷ ₫";
                          }
                        } else {
                          // Tiếng Anh: 380M VND
                          if (value < 1000) {
                            return value + "VND";
                          } else if (value < 1000000) {
                            return (value / 1000).toFixed(0) + "K";
                          } else if (value < 1000000000) {
                            return (value / 1000000).toFixed(1).replace(".0", "") + "M";
                          } else {
                            return (value / 1000000000).toFixed(1).replace(".0", "") + "B";
                          }
                        }
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatPrice(value)}
                      labelFormatter={(label) => label}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={2}
                      name={t("organizer.dashboard.revenue", "Revenue")}
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <TrendingUp className="mx-auto mb-3 text-neutral-300" size={48} />
                      <p className="text-base font-medium text-neutral-600">
                        {t("organizer.dashboard.noSalesData", "No sales data available yet")}
                      </p>
                      <p className="text-sm text-neutral-400 mt-1">
                        {t("organizer.dashboard.salesDataHint", "Sales data will appear here once you have bookings")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Events */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("organizer.dashboard.topEvents", "Top Performing Events")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "organizer.dashboard.bestSelling",
                    "Your best selling events"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earnings?.topEvents && earnings.topEvents.length > 0 ? (
                    earnings.topEvents.slice(0, 5).map((event) => (
                      <div
                        key={event.eventId}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                        onClick={() => onNavigate("event-analytics", String(event.eventId))}
                      >
                        <div className="flex-1">
                          <div className="text-neutral-900 font-medium mb-1">
                            {event.title}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {event.ticketsSold.toLocaleString()}{" "}
                            {t(
                              "organizer.dashboard.ticketsSoldLabel",
                              "tickets sold"
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-neutral-900 font-semibold">
                            {formatPrice(event.revenue)}
                          </div>
                          <div className="text-sm text-green-600">
                            {t("organizer.dashboard.revenue", "Revenue")}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : events.filter(e => e.revenue > 0).length > 0 ? (
                    // Fallback: show events sorted by revenue from events data
                    events
                      .filter(e => e.revenue > 0)
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map((event) => (
                        <div
                          key={event.eventId}
                          className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                          onClick={() => onNavigate("event-analytics", String(event.eventId))}
                        >
                          <div className="flex-1">
                            <div className="text-neutral-900 font-medium mb-1">
                              {event.title}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {event.soldSeats.toLocaleString()}{" "}
                              {t(
                                "organizer.dashboard.ticketsSoldLabel",
                                "tickets sold"
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-neutral-900 font-semibold">
                              {formatPrice(event.revenue)}
                            </div>
                            <div className="text-sm text-green-600">
                              {t("organizer.dashboard.revenue", "Revenue")}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="flex items-center justify-center py-12 text-neutral-500">
                      <div className="text-center">
                        <Calendar className="mx-auto mb-3 text-neutral-300" size={48} />
                        <p className="text-base font-medium text-neutral-600">
                          {t("organizer.dashboard.noEventsYet", "No events created yet")}
                        </p>
                        <p className="text-sm text-neutral-400 mt-1">
                          {t("organizer.dashboard.createFirstEvent", "Create your first event to start selling tickets")}
                        </p>
                      </div>
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
                <div className="flex flex-col gap-4">
                  <div>
                    <CardTitle>
                      {t("organizer.dashboard.yourEvents", "Your Events")}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        "organizer.dashboard.manageEvents",
                        "Manage and track all your events"
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        size={16}
                      />
                      <Input
                        placeholder={t("organizer.dashboard.searchEvents", "Tìm kiếm sự kiện...")}
                        value={eventSearchTerm}
                        onChange={(e) => setEventSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={eventDateFilter}
                      onValueChange={setEventDateFilter}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder={t("admin.filterByDate", "Lọc theo ngày")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("admin.allDates", "Tất cả ngày")}
                        </SelectItem>
                        <SelectItem value="today">
                          {t("admin.today", "Hôm nay")}
                        </SelectItem>
                        <SelectItem value="thisWeek">
                          {t("admin.thisWeek", "Tuần này")}
                        </SelectItem>
                        <SelectItem value="thisMonth">
                          {t("admin.thisMonth", "Tháng này")}
                        </SelectItem>
                        <SelectItem value="upcoming">
                          {t("admin.upcoming", "Sắp diễn ra")}
                        </SelectItem>
                        <SelectItem value="past">
                          {t("admin.past", "Đã qua")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("organizer.dashboard.allEvents", "Tất cả")}
                        </SelectItem>
                        <SelectItem value="draft">
                          {t("organizer.dashboard.draft", "Draft")}
                        </SelectItem>
                        <SelectItem value="pending">
                          {t("organizer.dashboard.pending", "Pending")}
                        </SelectItem>
                        <SelectItem value="approved">
                          {t("organizer.dashboard.approved", "Approved")}
                        </SelectItem>
                        <SelectItem value="rejected">
                          {t("organizer.dashboard.rejected", "Rejected")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-neutral-600 whitespace-nowrap">
                      Total: {filteredEvents.length} {t("admin.events", "Events")}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar
                      className="mx-auto text-neutral-300 mb-4"
                      size={64}
                    />
                    <h3 className="text-lg text-neutral-600 mb-2">
                      {statusFilter === "all"
                        ? t("organizer.dashboard.noEvents", "No events yet")
                        : t(
                            "organizer.dashboard.noStatusEvents",
                            `No ${statusFilter} events`,
                            { status: statusFilter }
                          )}
                    </h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      {statusFilter === "all"
                        ? t(
                            "organizer.dashboard.createFirstEvent",
                            "Create your first event to get started"
                          )
                        : t(
                            "organizer.dashboard.noStatusEventsDesc",
                            `You don't have any ${statusFilter} events at the moment`,
                            { status: statusFilter }
                          )}
                    </p>
                    {statusFilter === "all" && (
                      <Button
                        onClick={() => onNavigate("create-event")}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Plus size={16} className="mr-2" />
                        {t(
                          "organizer.dashboard.createYourFirstEvent",
                          "Create Your First Event"
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[18%] text-center">
                          {t("organizer.dashboard.event", "Event")}
                        </TableHead>
                        <TableHead className="w-[14%] text-center">
                          {t("organizer.dashboard.date", "Date")}
                        </TableHead>
                        <TableHead className="w-[12%] text-center">
                          {t("organizer.dashboard.status", "Status")}
                        </TableHead>
                        <TableHead className="w-[18%] text-center">
                          {t("organizer.dashboard.sold", "Sold")}
                        </TableHead>
                        <TableHead className="w-[20%] text-center">
                          {t("organizer.dashboard.reason", "Reason")}
                        </TableHead>
                        <TableHead className="w-[18%] text-center">
                          {t("organizer.dashboard.actions", "Actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents
                        .slice((eventsPage - 1) * itemsPerPage, eventsPage * itemsPerPage)
                        .map((event) => {
                          const salesRate =
                            event.totalSeats > 0
                              ? (
                                  (event.soldSeats / event.totalSeats) *
                                  100
                                ).toFixed(1)
                              : "0";

                          return (
                            <TableRow key={event.eventId}>
                            <TableCell className="w-[18%]">
                              <div className="flex flex-col items-center">
                                <div className="text-neutral-900 font-medium truncate max-w-full">
                                  {event.title}
                                </div>
                                <div className="text-sm text-neutral-500">
                                  ID: #{event.eventId}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="w-[14%] text-center">
                              <div className="text-sm whitespace-nowrap">
                                {new Date(event.startDate).toLocaleDateString(
                                  i18n.language === 'vi' ? 'vi-VN' : 'en-US',
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 whitespace-nowrap">
                                {new Date(event.startDate).toLocaleTimeString(
                                  i18n.language === 'vi' ? 'vi-VN' : 'en-US',
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[12%] text-center">
                              <div className="flex justify-center">
                                <Badge
                                  variant="outline"
                                  style={
                                    event.status === "Published"
                                      ? { backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }
                                      : event.status === "Approved"
                                      ? { backgroundColor: '#d1fae5', color: '#047857', borderColor: '#a7f3d0' }
                                      : event.status === "Completed"
                                      ? { backgroundColor: '#ccfbf1', color: '#0f766e', borderColor: '#99f6e4' }
                                      : event.status === "Pending"
                                      ? { backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }
                                      : event.status === "Rejected"
                                      ? { backgroundColor: '#ffe4e6', color: '#be123c', borderColor: '#fecdd3' }
                                      : event.status === "Cancelled"
                                      ? { backgroundColor: '#f3f4f6', color: '#4b5563', borderColor: '#d1d5db' }
                                      : event.status === "Draft"
                                      ? { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }
                                      : { backgroundColor: '#f5f5f5', color: '#525252', borderColor: '#d4d4d4' }
                                  }
                                >
                                  {t(`organizer.dashboard.${event.status.toLowerCase()}`, event.status)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="w-[18%]">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium whitespace-nowrap">
                                    {event.soldSeats} / {event.totalSeats}
                                  </span>
                                  <span className="text-xs text-neutral-500">
                                    ({salesRate}%)
                                  </span>
                                </div>
                                <div className="w-full max-w-[120px] bg-neutral-200 rounded-full h-1.5">
                                  <div
                                    className="bg-orange-500 h-1.5 rounded-full"
                                    style={{ width: `${salesRate}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="w-[20%] text-center">
                              {event.rejectionReason ? (
                                <div className="text-sm text-red-600 max-w-[200px] mx-auto truncate" title={event.rejectionReason}>
                                  {event.rejectionReason}
                                </div>
                              ) : (
                                <span className="text-sm text-neutral-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="w-[18%]">
                              <div className="flex gap-2 justify-center flex-wrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onNavigate(
                                      "event-analytics",
                                      String(event.eventId)
                                    )
                                  }
                                  className="text-teal-600 hover:bg-teal-50 px-3 h-8 text-xs"
                                >
                                  {t(
                                    "organizer.dashboard.analytics",
                                    "Analytics"
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onNavigate(
                                      "edit-seat-map",
                                      String(event.eventId)
                                    )
                                  }
                                  className="text-purple-600 hover:bg-purple-50 px-3 h-8 text-xs"
                                  title="Edit seat map for this event"
                                >
                                  {t("organizer.dashboard.seatMap", "Seat Map")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onNavigate(
                                      "event-detail",
                                      String(event.eventId)
                                    )
                                  }
                                  className="px-3 h-8 text-xs"
                                >
                                  {t("organizer.dashboard.view", "View")}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                {filteredEvents.length > itemsPerPage && (() => {
                  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
                  return (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventsPage((p: number) => Math.max(1, p - 1))}
                        disabled={eventsPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <span className="text-sm text-neutral-600">
                        {eventsPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventsPage((p: number) => Math.min(totalPages, p + 1))}
                        disabled={eventsPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <CardTitle>
                      {t("organizer.dashboard.recentOrders", "Recent Orders")}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        "organizer.dashboard.trackPurchases",
                        "Track customer purchases"
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        size={16}
                      />
                      <Input
                        placeholder={t("organizer.dashboard.searchOrders", "Tìm kiếm đơn hàng, khách hàng...")}
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={orderDateFilter}
                      onValueChange={setOrderDateFilter}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder={t("admin.filterByDate", "Lọc theo ngày")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("admin.allDates", "Tất cả ngày")}
                        </SelectItem>
                        <SelectItem value="today">
                          {t("admin.today", "Hôm nay")}
                        </SelectItem>
                        <SelectItem value="thisWeek">
                          {t("admin.thisWeek", "Tuần này")}
                        </SelectItem>
                        <SelectItem value="thisMonth">
                          {t("admin.thisMonth", "Tháng này")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={orderStatusFilter}
                      onValueChange={setOrderStatusFilter}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("admin.allStatus", "Tất cả")}
                        </SelectItem>
                        <SelectItem value="confirmed">
                          {t("booking.status.confirmed", "Confirmed")}
                        </SelectItem>
                        <SelectItem value="pending">
                          {t("booking.status.pending", "Pending")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-neutral-600 whitespace-nowrap">
                      Total: {filteredBookings.length} {t("organizer.dashboard.orders", "Orders")}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("organizer.dashboard.orderId", "Order ID")}
                      </TableHead>
                      <TableHead>
                        {t("organizer.dashboard.customer", "Customer")}
                      </TableHead>
                      <TableHead>
                        {t("organizer.dashboard.event", "Event")}
                      </TableHead>
                      <TableHead>
                        {t("organizer.dashboard.tickets", "Tickets")}
                      </TableHead>
                      <TableHead>
                        {t("organizer.dashboard.amount", "Amount")}
                      </TableHead>
                      <TableHead>
                        {t("organizer.dashboard.date", "Date")}
                      </TableHead>
                      <TableHead>
                        {t("organizer.dashboard.status", "Status")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                          {t('organizer.dashboard.noBookings', 'No bookings found')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings
                        .slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage)
                        .map((booking) => {
                          return (
                            <TableRow key={booking.bookingId}>
                              <TableCell className="font-mono text-sm">
                                {booking.bookingCode}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="text-neutral-900">
                                    {booking.customerName}
                                  </div>
                                  <div className="text-sm text-neutral-500">
                                    {booking.customerEmail}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {booking.eventTitle}
                              </TableCell>
                              <TableCell>{booking.totalTickets}</TableCell>
                              <TableCell>{formatPrice(booking.totalAmount)}</TableCell>
                              <TableCell>
                                <div className="text-sm text-neutral-600">
                                  {new Date(booking.bookingDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  })}
                                  <div className="text-xs text-neutral-500">
                                    {new Date(booking.bookingDate).toLocaleTimeString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  booking.status.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  booking.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-neutral-100 text-neutral-700'
                                }>
                                  {booking.status.toLowerCase() === 'confirmed' ? t('booking.status.confirmed') : 
                                   booking.status.toLowerCase() === 'pending' ? t('booking.status.pending') : 
                                   booking.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
                {filteredBookings.length > itemsPerPage && (() => {
                  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
                  return (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrdersPage((p: number) => Math.max(1, p - 1))}
                        disabled={ordersPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <span className="text-sm text-neutral-600">
                        {ordersPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrdersPage((p: number) => Math.min(totalPages, p + 1))}
                        disabled={ordersPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t(
                      "organizer.dashboard.revenueByEvent",
                      "Revenue by Event"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "organizer.dashboard.eventComparison",
                      "Comparison of event performance"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(earnings?.topEvents && earnings.topEvents.length > 0) || events.filter(e => e.revenue > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart 
                      data={
                        earnings?.topEvents && earnings.topEvents.length > 0
                          ? earnings.topEvents.slice(0, 5)
                          : events
                              .filter(e => e.revenue > 0)
                              .sort((a, b) => b.revenue - a.revenue)
                              .slice(0, 5)
                              .map(e => ({
                                eventId: e.eventId,
                                title: e.title.length > 20 ? e.title.substring(0, 20) + '...' : e.title,
                                revenue: e.revenue,
                                ticketsSold: e.soldSeats
                              }))
                      } 
                      margin={{ top: 20, right: 30, left: -15, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="title" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        width={80}
                        tickFormatter={(value) => {
                          const isVietnamese = i18n.language === 'vi';
                          if (isVietnamese) {
                            if (value < 1000) {
                              return value + "₫";
                            } else if (value < 1000000) {
                              return (value / 1000).toFixed(0) + "k ₫";
                            } else if (value < 1000000000) {
                              return (value / 1000000).toFixed(1).replace(".0", "") + "tr ₫";
                            } else {
                              return (value / 1000000000).toFixed(1).replace(".0", "") + "tỷ ₫";
                            }
                          } else {
                            if (value < 1000) {
                              return value + "VND";
                            } else if (value < 1000000) {
                              return (value / 1000).toFixed(0) + "K";
                            } else if (value < 1000000000) {
                              return (value / 1000000).toFixed(1).replace(".0", "") + "M";
                            } else {
                              return (value / 1000000000).toFixed(1).replace(".0", "") + "B";
                            }
                          }
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatPrice(value)}
                      />
                      <Bar dataKey="revenue" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <Calendar className="mx-auto mb-3 text-neutral-300" size={48} />
                        <p className="text-base font-medium text-neutral-600">
                          {t("organizer.dashboard.noRevenueData", "No revenue data available")}
                        </p>
                        <p className="text-sm text-neutral-400 mt-1">
                          {t("organizer.dashboard.revenueDataHint", "Revenue data will appear here when tickets are purchased")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("organizer.dashboard.salesRate", "Ticket Sales Rate")}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "organizer.dashboard.percentageSold",
                      "Percentage of tickets sold"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      // Get events that have sold at least 1 ticket
                      const eventsWithSales = events.filter(e => e.soldSeats > 0);

                      if (eventsWithSales.length === 0) {
                        return (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <Ticket className="mx-auto mb-3 text-neutral-300" size={48} />
                              <p className="text-base font-medium text-neutral-600">
                                {t("organizer.dashboard.noTicketsSold", "No tickets sold yet")}
                              </p>
                              <p className="text-sm text-neutral-400 mt-1">
                                {t("organizer.dashboard.ticketSalesHint", "Sales data will appear here once customers purchase tickets")}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return eventsWithSales
                        .sort((a, b) => {
                          // Sort by tickets sold descending
                          return b.soldSeats - a.soldSeats;
                        })
                        .slice(0, 5)
                        .map((event) => {
                          const salesRate = event.totalSeats > 0
                            ? ((event.soldSeats / event.totalSeats) * 100).toFixed(1)
                            : "0";

                          return (
                            <div 
                              key={event.eventId}
                              className="hover:bg-neutral-50 p-2.5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                              onClick={() => onNavigate("event-analytics", String(event.eventId))}
                            >
                              <div className="flex justify-between items-start mb-1.5">
                                <div className="flex-1 pr-3">
                                  <span className="text-sm text-neutral-900 font-medium block truncate">
                                    {event.title}
                                  </span>
                                  <span className="text-xs text-neutral-500 mt-0.5 block">
                                    {event.soldSeats.toLocaleString()} {t("organizer.dashboard.ticketsSoldLabel", "tickets sold")}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-semibold text-orange-600 whitespace-nowrap">{salesRate}%</span>
                                  <span className="text-xs text-neutral-500 block mt-0.5 whitespace-nowrap">
                                    {event.soldSeats}/{event.totalSeats}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-2">
                                <div
                                  className="bg-orange-500 h-2 rounded-full transition-all"
                                  style={{ width: `${salesRate}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                    })()}
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
