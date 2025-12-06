import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
import {
  organizerService,
  type OrganizerEventDto,
  type OrganizerEarningsDto,
} from "../services/organizerService";
import { authService } from "../services/authService";
import { mockOrders } from "../mockData";

interface OrganizerDashboardProps {
  onNavigate: (page: string, eventId?: string) => void;
}

export function OrganizerDashboard({ onNavigate }: OrganizerDashboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<OrganizerEventDto[]>([]);
  const [earnings, setEarnings] = useState<OrganizerEarningsDto | null>(null);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, draft, pending, approved, rejected

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
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatCompactPrice = (price: number) => {
    if (price >= 1000000000) {
      const billions = price / 1000000000;
      return billions % 1 === 0 ? billions.toFixed(0) + 'b' : billions.toFixed(1) + 'b';
    } else if (price >= 1000000) {
      const millions = price / 1000000;
      return millions % 1 === 0 ? millions.toFixed(0) + 'm' : millions.toFixed(1) + 'm';
    } else if (price >= 1000) {
      const thousands = price / 1000;
      return thousands % 1 === 0 ? thousands.toFixed(0) + 'k' : thousands.toFixed(1) + 'k';
    }
    return price.toString();
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

  // Filter events by status
  const filteredEvents =
    statusFilter === "all"
      ? events
      : events.filter(
          (e) => e.status.toLowerCase() === statusFilter.toLowerCase()
        );

  // Calculate stats from real data
  const totalRevenue = earnings?.totalRevenue || 0;
  const totalSold = events.reduce((sum, event) => sum + event.soldSeats, 0);
  const _totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === "Approved").length;
  const pendingEvents = events.filter((e) => e.status === "Pending").length;

  // Format monthly revenue for chart
  const salesData = earnings?.monthlyRevenue || [];

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
                  <p className="text-xs text-green-600 mt-1">
                    <TrendingUp size={12} className="inline mr-1" />
                    {t(
                      "organizer.dashboard.increaseLastMonth",
                      "+8.2% from last month"
                    )}
                  </p>
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
            </div>

            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("organizer.dashboard.salesTrend", "Sales Trend")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "organizer.dashboard.monthlyRevenue",
                    "Monthly revenue performance"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="pr-8">
                  <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
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
                    earnings.topEvents.map((event) => (
                      <div
                        key={event.eventId}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
                      >
                        <div className="flex-1">
                          <div className="text-neutral-900 mb-1">
                            {event.title}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {event.ticketsSold}{" "}
                            {t(
                              "organizer.dashboard.ticketsSoldLabel",
                              "tickets sold"
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-neutral-900">
                            {formatPrice(event.revenue)}
                          </div>
                          <div className="text-sm text-green-600">
                            {t("organizer.dashboard.revenue", "Revenue")}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      {t(
                        "organizer.dashboard.noEventData",
                        "No event data available"
                      )}
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
                  <div className="flex gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue
                          placeholder={t(
                            "organizer.dashboard.filterByStatus",
                            "Filter by status"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("organizer.dashboard.allEvents", "All Events")}
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
                    <Button
                      onClick={() => onNavigate("create-event")}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus size={16} className="mr-2" />
                      {t("organizer.dashboard.newEvent", "New Event")}
                    </Button>
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
                        <TableHead className="w-[22%] text-center">
                          {t("organizer.dashboard.event", "Event")}
                        </TableHead>
                        <TableHead className="w-[16%] text-center">
                          {t("organizer.dashboard.date", "Date")}
                        </TableHead>
                        <TableHead className="w-[14%] text-center">
                          {t("organizer.dashboard.status", "Status")}
                        </TableHead>
                        <TableHead className="w-[22%] text-center">
                          {t("organizer.dashboard.sold", "Sold")}
                        </TableHead>
                        <TableHead className="w-[26%] text-center">
                          {t("organizer.dashboard.actions", "Actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => {
                        const salesRate =
                          event.totalSeats > 0
                            ? (
                                (event.soldSeats / event.totalSeats) *
                                100
                              ).toFixed(1)
                            : "0";

                        return (
                          <TableRow key={event.eventId}>
                            <TableCell className="w-[22%]">
                              <div className="flex flex-col items-center">
                                <div className="text-neutral-900 font-medium truncate max-w-full">
                                  {event.title}
                                </div>
                                <div className="text-sm text-neutral-500">
                                  ID: #{event.eventId}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="w-[16%] text-center">
                              <div className="text-sm whitespace-nowrap">
                                {new Date(event.startDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 whitespace-nowrap">
                                {new Date(event.startDate).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[14%] text-center">
                              <div className="flex justify-center">
                                <Badge
                                  className={
                                    event.status === "Approved"
                                      ? "bg-green-100 text-green-700"
                                      : event.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : event.status === "Rejected"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-neutral-100 text-neutral-700"
                                  }
                                >
                                  {event.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="w-[22%]">
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
                            <TableCell className="w-[26%]">
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
                {filteredEvents.length > itemsPerPage && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                      disabled={eventsPage === 1}
                    >
                      {t('common.previous', 'Previous')}
                    </Button>
                    <span className="text-sm text-neutral-600">
                      {t('common.page', 'Page')} <span className="font-semibold">{eventsPage}</span> {t('common.of', 'of')} <span className="font-semibold">{Math.ceil(filteredEvents.length / itemsPerPage)}</span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventsPage(p => Math.min(Math.ceil(filteredEvents.length / itemsPerPage), p + 1))}
                      disabled={eventsPage >= Math.ceil(filteredEvents.length / itemsPerPage)}
                    >
                      {t('common.next', 'Next')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("organizer.dashboard.recentOrders", "Recent Orders")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "organizer.dashboard.trackPurchases",
                    "Track customer purchases"
                  )}
                </CardDescription>
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
                        {t("organizer.dashboard.status", "Status")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrders.map((order) => {
                      const event = events.find(
                        (e) => String(e.eventId) === order.eventId
                      );
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            {order.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-neutral-900">
                                {order.userName}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {order.userEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {event?.title ||
                              t(
                                "organizer.dashboard.unknownEvent",
                                "Unknown Event"
                              )}
                          </TableCell>
                          <TableCell>{order.tickets.length}</TableCell>
                          <TableCell>{formatPrice(order.total)}</TableCell>
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
                              booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-neutral-100 text-neutral-700'
                            }>
                              {booking.status === 'Confirmed' ? t('booking.status.confirmed') : 
                               booking.status === 'Pending' ? t('booking.status.pending') : 
                               booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {bookings.length > itemsPerPage && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                      disabled={ordersPage === 1}
                    >
                      {t('common.previous', 'Previous')}
                    </Button>
                    <span className="text-sm text-neutral-600">
                      {t('common.page', 'Page')} <span className="font-semibold">{ordersPage}</span> {t('common.of', 'of')} <span className="font-semibold">{Math.ceil(bookings.length / itemsPerPage)}</span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrdersPage(p => Math.min(Math.ceil(bookings.length / itemsPerPage), p + 1))}
                      disabled={ordersPage >= Math.ceil(bookings.length / itemsPerPage)}
                    >
                      {t('common.next', 'Next')}
                    </Button>
                  </div>
                )}
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
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={earnings?.topEvents || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatPrice(value)}
                      />
                      <Bar dataKey="revenue" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
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
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event) => {
                      const salesRate =
                        event.totalSeats > 0
                          ? (
                              (event.soldSeats / event.totalSeats) *
                              100
                            ).toFixed(1)
                          : "0";

                      return (
                        <div key={topEvent.eventId}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-neutral-600">
                              {event.title}
                            </span>
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
