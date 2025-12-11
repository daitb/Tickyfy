import { useState, useEffect } from "react";
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
  Grid3x3,
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
import {
  organizerService,
  type OrganizerEventDto,
} from "../services/organizerService";
import { eventService } from "../services/eventService";
import { authService } from "../services/authService";
import { toast } from "sonner";

interface EventManagementProps {
  onNavigate: (page: string, eventId?: string) => void;
}

type ViewMode = "grid" | "list";
type StatusFilter =
  | "all"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Published"
  | "Cancelled"
  | "Completed";
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
  soldSeats: number;
  totalSeats: number;
  revenue: number;
}

export function EventManagement({ onNavigate }: EventManagementProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [events, setEvents] = useState<OrganizerEventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const currentUser = authService.getCurrentUser();
        if (!currentUser?.organizerId) {
          throw new Error("Organizer ID not found");
        }
        const data = await organizerService.getOrganizerEvents(
          currentUser.organizerId
        );
        setEvents(data);
        setError("");
      } catch (err: any) {
        console.error("Failed to load events:", err);
        setError(err.response?.data?.message || "Failed to load events");
        toast.error("Không thể tải danh sách sự kiện", {
          description: err.response?.data?.message || "Vui lòng thử lại sau",
          duration: 2000,
          closeButton: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Check if event can be edited
  const canEditEvent = (status: string): boolean => {
    return (
      status === "Pending" || status === "Approved" || status === "Rejected"
    );
  };

  // Calculate stats from real events
  const totalEvents = events.length;
  const activeEvents = events.filter(
    (e) => e.status === "Published" || e.status === "Approved"
  ).length;
  const totalTicketsSold = events.reduce((sum, e) => sum + e.soldSeats, 0);
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;

    const eventDate = new Date(event.startDate);
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
      case "Pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            {t("eventManagement.pending", "Pending")}
          </Badge>
        );
      case "Approved":
        return (
          <Badge className="bg-green-100 text-green-700">
            {t("eventManagement.approved", "Approved")}
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-100 text-red-700">
            {t("eventManagement.rejected", "Rejected")}
          </Badge>
        );
      case "Published":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            {t("eventManagement.published", "Published")}
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge className="bg-red-100 text-red-700">
            {t("eventManagement.cancelled", "Cancelled")}
          </Badge>
        );
      case "Completed":
        return (
          <Badge className="bg-gray-100 text-gray-700">
            {t("eventManagement.completed", "Completed")}
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const handleEventAction = (action: string, eventId: string) => {
    const event = events.find((e) => e.eventId === Number(eventId));

    switch (action) {
      case "view":
        onNavigate("event-detail", eventId);
        break;
      case "edit":
        // Navigate to edit page (would need to create this)
        onNavigate("organizer-wizard", eventId);
        break;
      case "edit-seat-map":
        // Navigate to seat map editor
        onNavigate("edit-seat-map", eventId);
        break;
      case "analytics":
        // Navigate to analytics page
        onNavigate("event-analytics", eventId);
        break;
      case "duplicate":
        handleDuplicateEvent(eventId);
        break;
      case "delete":
        setEventToDelete(eventId);
        break;
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      await eventService.deleteEvent(Number(eventToDelete));

      toast.success("Sự kiện đã được xóa thành công", {
        duration: 3000,
      });

      // Reload events
      const currentUser = authService.getCurrentUser();
      if (currentUser?.organizerId) {
        const data = await organizerService.getOrganizerEvents(
          currentUser.organizerId
        );
        setEvents(data);
      }
    } catch (err: any) {
      console.error("Failed to delete event:", err);
      toast.error("Không thể xóa sự kiện", {
        description: err.response?.data?.message || "Vui lòng thử lại sau",
        duration: 3000,
      });
    } finally {
      setEventToDelete(null);
    }
  };

  const handleDuplicateEvent = async (eventId: string) => {
    try {
      const duplicatedEvent = await eventService.duplicateEvent(Number(eventId));

      toast.success("Đã nhân bản sự kiện thành công", {
        description: "Vui lòng cập nhật thông tin cho sự kiện mới",
        duration: 3000,
      });

      // Reload events
      const currentUser = authService.getCurrentUser();
      if (currentUser?.organizerId) {
        const data = await organizerService.getOrganizerEvents(
          currentUser.organizerId
        );
        setEvents(data);
      }

      // Navigate to edit the new duplicated event (use duplicatedEvent.id which is string)
      onNavigate("organizer-wizard", duplicatedEvent.id);
    } catch (err: any) {
      console.error("Failed to duplicate event:", err);
      toast.error("Không thể nhân bản sự kiện", {
        description: err.response?.data?.message || "Vui lòng thử lại sau",
        duration: 3000,
      });
    }
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
                    {t("eventManagement.allStatus", "All Status")}
                  </SelectItem>
                  <SelectItem value="Pending">
                    {t("eventManagement.pending", "Pending")}
                  </SelectItem>
                  <SelectItem value="Approved">
                    {t("eventManagement.approved", "Approved")}
                  </SelectItem>
                  <SelectItem value="Rejected">
                    {t("eventManagement.rejected", "Rejected")}
                  </SelectItem>
                  <SelectItem value="Published">
                    {t("eventManagement.published", "Published")}
                  </SelectItem>
                  <SelectItem value="Cancelled">
                    {t("eventManagement.cancelled", "Cancelled")}
                  </SelectItem>
                  <SelectItem value="Completed">
                    {t("eventManagement.completed", "Completed")}
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
            {isLoading ? (
              <Card className="p-16">
                <div className="text-center">
                  <div className="text-neutral-600">
                    {t("eventManagement.loading", "Loading events...")}
                  </div>
                </div>
              </Card>
            ) : filteredEvents.length === 0 ? (
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
                {filteredEvents.map((event) => {
                  const eventIdStr = event.eventId.toString();
                  const canEdit = canEditEvent(event.status);
                  return (
                    <Card
                      key={event.eventId}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative">
                        <div className="aspect-video bg-neutral-200 overflow-hidden">
                          <img
                            src={event.bannerImage || "/placeholder-event.jpg"}
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
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center justify-between py-3 border-t">
                          <div>
                            <div className="text-xs text-neutral-600">
                              {t("eventManagement.ticketsSold")}
                            </div>
                            <div className="text-neutral-900">
                              {event.soldSeats}/{event.totalSeats}
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
                            onClick={() =>
                              handleEventAction("view", eventIdStr)
                            }
                          >
                            <Eye size={14} className="mr-1" />
                            {t("eventManagement.viewDetails")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={!canEdit}
                            onClick={() =>
                              handleEventAction("edit", eventIdStr)
                            }
                            title={
                              !canEdit
                                ? t(
                                    "eventManagement.cannotEdit",
                                    "Cannot edit this event"
                                  )
                                : ""
                            }
                          >
                            <Edit size={14} className="mr-1" />
                            {t("eventManagement.editEvent")}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-shrink-0 px-2"
                              >
                                <MoreVertical size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("analytics", eventIdStr)
                                }
                              >
                                <TrendingUp size={14} className="mr-2" />
                                {t("eventManagement.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("edit-seat-map", eventIdStr)
                                }
                              >
                                <Grid3x3 size={14} className="mr-2" />
                                Manage Seat Map
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("duplicate", eventIdStr)
                                }
                              >
                                <Copy size={14} className="mr-2" />
                                {t("eventManagement.duplicate")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEventAction("delete", eventIdStr)
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
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Events List View */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="text-neutral-600">
                    {t("eventManagement.loading", "Loading events...")}
                  </div>
                </div>
              ) : filteredEvents.length === 0 ? (
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
                    {filteredEvents.map((event) => {
                      const eventIdStr = event.eventId.toString();
                      const canEdit = canEditEvent(event.status);
                      return (
                        <TableRow
                          key={event.eventId}
                          className="hover:bg-neutral-50"
                        >
                          <TableCell>
                            <div className="w-16 h-16 bg-neutral-200 rounded overflow-hidden">
                              <img
                                src={
                                  event.bannerImage || "/placeholder-event.jpg"
                                }
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-neutral-900">
                              {event.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{formatDate(event.startDate)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <div className="truncate">-</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(event.status)}</TableCell>
                          <TableCell className="text-right">
                            {event.soldSeats}/{event.totalSeats}
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
                                    handleEventAction("view", eventIdStr)
                                  }
                                >
                                  <Eye size={14} className="mr-2" />
                                  {t("eventManagement.viewDetails")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEventAction("edit", eventIdStr)
                                  }
                                  disabled={!canEdit}
                                  title={
                                    !canEdit
                                      ? t(
                                          "eventManagement.cannotEdit",
                                          "Cannot edit this event"
                                        )
                                      : ""
                                  }
                                >
                                  <Edit size={14} className="mr-2" />
                                  {t("eventManagement.editEvent")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEventAction(
                                      "edit-seat-map",
                                      eventIdStr
                                    )
                                  }
                                >
                                  <Grid3x3 size={14} className="mr-2" />
                                  Manage Seat Map
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEventAction("analytics", eventIdStr)
                                  }
                                >
                                  <TrendingUp size={14} className="mr-2" />
                                  {t("eventManagement.viewDetails")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEventAction("duplicate", eventIdStr)
                                  }
                                >
                                  <Copy size={14} className="mr-2" />
                                  {t("eventManagement.duplicate")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEventAction("delete", eventIdStr)
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
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

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
