import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Ticket,
  DollarSign,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  XCircle,
  LayoutGrid,
  List,
  Search,
  TrendingUp,
  Filter,
  Layout,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { mockEvents } from "../mockData";

interface EventManagementProps {
  onNavigate: (page: string, eventId?: string) => void;
}

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "published" | "draft" | "cancelled";
type DateFilter = "all" | "upcoming" | "past";

interface EventWithStats {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  category: string;
  image: string;
  status: "published" | "draft" | "cancelled";
  ticketsSold: number;
  totalTickets: number;
  revenue: number;
}

export function EventManagement({ onNavigate }: EventManagementProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [eventToCancel, setEventToCancel] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Mock event data with stats
  const eventsWithStats: EventWithStats[] = mockEvents.map((event, index) => ({
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    venue: event.venue,
    city: event.city,
    category: event.category,
    image: event.image,
    status:
      index % 5 === 0 ? "draft" : index % 7 === 0 ? "cancelled" : "published",
    ticketsSold: Math.floor(Math.random() * 500),
    totalTickets: 500,
    revenue: Math.floor(Math.random() * 50000000) + 10000000,
  }));

  // Calculate stats
  const totalEvents = eventsWithStats.length;
  const activeEvents = eventsWithStats.filter(
    (e) => e.status === "published"
  ).length;
  const totalTicketsSold = eventsWithStats.reduce(
    (sum, e) => sum + e.ticketsSold,
    0
  );
  const totalRevenue = eventsWithStats.reduce((sum, e) => sum + e.revenue, 0);

  // Filter events
  const filteredEvents = eventsWithStats.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;

    const eventDate = new Date(event.date);
    const today = new Date();
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "upcoming" && eventDate >= today) ||
      (dateFilter === "past" && eventDate < today);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-100 text-green-700">
            {t("eventManagement.published")}
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-amber-100 text-amber-700">
            {t("eventManagement.draft")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700">
            {t("eventManagement.cancelled")}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleEventAction = (action: string, eventId: string) => {
    switch (action) {
      case "view":
        onNavigate("event-detail", eventId);
        break;
      case "edit":
        onNavigate("edit-event", eventId);
        break;
      case "analytics":
        onNavigate("event-analytics", eventId);
        break;
      case "duplicate":
        console.log("Duplicate event:", eventId);
        break;
      case "cancel":
        setEventToCancel(eventId);
        break;
      case "delete":
        setEventToDelete(eventId);
        break;
    }
  };

  const confirmCancelEvent = () => {
    console.log("Cancelling event:", eventToCancel);
    setEventToCancel(null);
  };

  const confirmDeleteEvent = () => {
    console.log("Deleting event:", eventToDelete);
    setEventToDelete(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1>{t("editEvent.myEvents")}</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => onNavigate("organizer-wizard")}
              className="bg-teal-500 hover:bg-teal-600"
            >
              <Plus size={18} className="mr-2" />
              {t("eventManagement.createEvent")}
            </Button>
            <div className="flex gap-1 bg-white rounded-lg border p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={
                  viewMode === "grid" ? "bg-teal-500 hover:bg-teal-600" : ""
                }
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={
                  viewMode === "list" ? "bg-teal-500 hover:bg-teal-600" : ""
                }
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-600">
                  {t("eventManagement.totalEvents")}
                </div>
                <Calendar className="text-teal-500" size={20} />
              </div>
              <div className="text-2xl text-neutral-900">{totalEvents}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-600">
                  {t("eventManagement.activeEvents")}
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <div className="text-2xl text-neutral-900">{activeEvents}</div>
              <div className="text-xs text-green-600 mt-1">
                {t("eventManagement.published")}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-600">
                  {t("eventManagement.ticketsSold")}
                </div>
                <Ticket className="text-teal-500" size={20} />
              </div>
              <div className="text-2xl text-neutral-900">
                {totalTicketsSold.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-neutral-600">
                  {t("eventManagement.totalRevenue")}
                </div>
                <DollarSign className="text-teal-500" size={20} />
              </div>
              <div className="text-2xl text-neutral-900">
                {formatPrice(totalRevenue).replace("₫", "")}₫
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  size={18}
                />
                <Input
                  placeholder={t("eventManagement.searchEvents")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("eventManagement.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("eventManagement.allStatus")}
                  </SelectItem>
                  <SelectItem value="published">
                    {t("eventManagement.published")}
                  </SelectItem>
                  <SelectItem value="draft">
                    {t("eventManagement.draft")}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {t("eventManagement.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={dateFilter}
                onValueChange={(v) => setDateFilter(v as DateFilter)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("eventManagement.date")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("eventManagement.allTime")}
                  </SelectItem>
                  <SelectItem value="upcoming">
                    {t("eventManagement.upcoming")}
                  </SelectItem>
                  <SelectItem value="past">
                    {t("eventManagement.past")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid View */}
        {viewMode === "grid" && (
          <>
            {filteredEvents.length === 0 ? (
              <Card className="p-16">
                <div className="text-center">
                  <Calendar
                    className="mx-auto text-neutral-400 mb-4"
                    size={64}
                  />
                  <h3 className="text-neutral-900 mb-2">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    dateFilter !== "all"
                      ? t("eventManagement.noEvents")
                      : t("eventManagement.noEvents")}
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    dateFilter !== "all"
                      ? "Try adjusting your filters"
                      : t("eventManagement.noEventsMessage")}
                  </p>
                  {!searchTerm &&
                    statusFilter === "all" &&
                    dateFilter === "all" && (
                      <Button
                        onClick={() => onNavigate("organizer-wizard")}
                        className="bg-teal-500 hover:bg-teal-600"
                      >
                        <Plus size={18} className="mr-2" />
                        {t("eventManagement.createEvent")}
                      </Button>
                    )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative">
                      <div className="aspect-video bg-neutral-200 overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(event.status)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-neutral-900 mb-2 line-clamp-1">
                        {event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-neutral-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>
                            {formatDate(event.date)} • {event.time}
                          </span>
                        </div>
                        <div className="truncate">
                          {event.venue}, {event.city}
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center justify-between py-3 border-t">
                        <div>
                          <div className="text-xs text-neutral-600">
                            {t("eventManagement.ticketsSold")}
                          </div>
                          <div className="text-neutral-900">
                            {event.ticketsSold}/{event.totalTickets}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-neutral-600">
                            {t("eventManagement.revenue")}
                          </div>
                          <div className="text-teal-600">
                            {formatPrice(event.revenue)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEventAction("view", event.id)}
                        >
                          <Eye size={14} className="mr-1" />
                          {t("eventManagement.viewDetails")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEventAction("edit", event.id)}
                        >
                          <Edit size={14} className="mr-1" />
                          {t("eventManagement.editEvent")}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleEventAction("analytics", event.id)
                              }
                            >
                              <TrendingUp size={14} className="mr-2" />
                              {t("eventManagement.viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onNavigate("seat-map-builder", event.id)
                              }
                            >
                              <Layout size={14} className="mr-2" />
                              {t("eventManagement.seatMap") || "Seat Map"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleEventAction("duplicate", event.id)
                              }
                            >
                              <Copy size={14} className="mr-2" />
                              {t("eventManagement.duplicate")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleEventAction("cancel", event.id)
                              }
                              className="text-red-600"
                            >
                              <XCircle size={14} className="mr-2" />
                              {t("eventManagement.cancelEvent")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleEventAction("delete", event.id)
                              }
                              className="text-red-600"
                            >
                              <Trash2 size={14} className="mr-2" />
                              {t("eventManagement.deleteEvent")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Events List View */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar
                    className="mx-auto text-neutral-400 mb-4"
                    size={64}
                  />
                  <h3 className="text-neutral-900 mb-2">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    dateFilter !== "all"
                      ? t("eventManagement.noEvents")
                      : t("eventManagement.noEvents")}
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    dateFilter !== "all"
                      ? "Try adjusting your filters"
                      : t("eventManagement.noEventsMessage")}
                  </p>
                  {!searchTerm &&
                    statusFilter === "all" &&
                    dateFilter === "all" && (
                      <Button
                        onClick={() => onNavigate("organizer-wizard")}
                        className="bg-teal-500 hover:bg-teal-600"
                      >
                        <Plus size={18} className="mr-2" />
                        {t("eventManagement.createEvent")}
                      </Button>
                    )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">
                        {t("eventManagement.image")}
                      </TableHead>
                      <TableHead>{t("eventManagement.eventName")}</TableHead>
                      <TableHead>{t("eventManagement.date")}</TableHead>
                      <TableHead>{t("eventManagement.location")}</TableHead>
                      <TableHead>{t("eventManagement.status")}</TableHead>
                      <TableHead className="text-right">
                        {t("eventManagement.sold")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("eventManagement.revenue")}
                      </TableHead>
                      <TableHead className="text-right w-[80px]">
                        {t("eventManagement.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id} className="hover:bg-neutral-50">
                        <TableCell>
                          <div className="w-16 h-16 bg-neutral-200 rounded overflow-hidden">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-neutral-900">{event.title}</div>
                          <div className="text-sm text-neutral-500">
                            {event.category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(event.date)}</div>
                          <div className="text-sm text-neutral-500">
                            {event.time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="truncate">{event.venue}</div>
                            <div className="text-sm text-neutral-500">
                              {event.city}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell className="text-right">
                          {event.ticketsSold}/{event.totalTickets}
                        </TableCell>
                        <TableCell className="text-right text-teal-600">
                          {formatPrice(event.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("view", event.id)
                                }
                              >
                                <Eye size={14} className="mr-2" />
                                {t("eventManagement.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("edit", event.id)
                                }
                              >
                                <Edit size={14} className="mr-2" />
                                {t("eventManagement.editEvent")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("analytics", event.id)
                                }
                              >
                                <TrendingUp size={14} className="mr-2" />
                                {t("eventManagement.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("duplicate", event.id)
                                }
                              >
                                <Copy size={14} className="mr-2" />
                                {t("eventManagement.duplicate")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("cancel", event.id)
                                }
                                className="text-red-600"
                              >
                                <XCircle size={14} className="mr-2" />
                                {t("eventManagement.cancelEvent")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("delete", event.id)
                                }
                                className="text-red-600"
                              >
                                <Trash2 size={14} className="mr-2" />
                                {t("eventManagement.deleteEvent")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancel Event Dialog */}
      <Dialog
        open={!!eventToCancel}
        onOpenChange={() => setEventToCancel(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("eventManagement.cancelEventTitle")}</DialogTitle>
            <DialogDescription>
              {t("eventManagement.cancelEventMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventToCancel(null)}>
              {t("eventManagement.keepEvent")}
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={confirmCancelEvent}
            >
              {t("eventManagement.confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog
        open={!!eventToDelete}
        onOpenChange={() => setEventToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("eventManagement.deleteEventTitle")}</DialogTitle>
            <DialogDescription>
              {t("eventManagement.deleteEventMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventToDelete(null)}>
              {t("eventManagement.keepIt")}
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={confirmDeleteEvent}
            >
              {t("eventManagement.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
