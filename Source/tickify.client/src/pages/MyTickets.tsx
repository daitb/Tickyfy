import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { QRTicketCard } from "../components/QRTicketCard";
import { ticketService, type TicketDto } from "../services/ticketService";
import { authService } from "../services/authService";
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

interface MyTicketsProps {
  orders: any[];
  onNavigate: (page: string, id?: string) => void;
}

export function MyTickets({ orders, onNavigate }: MyTicketsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  // Reload tickets when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTickets();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Reload tickets when tickets are updated (e.g., after transfer)
  useEffect(() => {
    const handleTicketsUpdated = () => {
      loadTickets();
    };
    window.addEventListener('tickets-updated', handleTicketsUpdated);
    return () => window.removeEventListener('tickets-updated', handleTicketsUpdated);
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        onNavigate("login");
        return;
      }

      const userTickets = await ticketService.getMyTickets();
      
      if (userTickets && Array.isArray(userTickets)) {
        setTickets(userTickets);
        setError(""); // Clear any previous errors
        if (userTickets.length === 0) {
          setError(""); // Don't show error for empty tickets, just show empty state
        }
      } else {
        setTickets([]);
        const errorMsg = "Không thể tải danh sách vé. Vui lòng thử lại.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Không thể tải danh sách vé. Vui lòng thử lại.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Group tickets by booking
  const ticketsByBooking = tickets.reduce((acc, ticket) => {
    const bookingId = ticket.bookingId.toString();
    if (!acc[bookingId]) {
      acc[bookingId] = {
        bookingId: ticket.bookingId,
        bookingNumber: ticket.bookingNumber,
        eventId: ticket.eventId,
        eventTitle: ticket.eventTitle,
        eventVenue: ticket.eventVenue,
        eventStartDate: ticket.eventStartDate,
        eventEndDate: ticket.eventEndDate,
        createdAt: ticket.createdAt,
        tickets: []
      };
    }
    acc[bookingId].tickets.push(ticket);
    return acc;
  }, {} as Record<string, {
    bookingId: number;
    bookingNumber: string;
    eventId: number;
    eventTitle: string;
    eventVenue: string;
    eventStartDate: string;
    eventEndDate: string;
    createdAt: string;
    tickets: TicketDto[];
  }>);

  const bookingGroups = Object.values(ticketsByBooking);

  const now = new Date();
  const upcomingBookings = bookingGroups.filter((group) => {
    const eventDate = new Date(group.eventStartDate);
    return eventDate >= now;
  });

  const pastBookings = bookingGroups.filter((group) => {
    const eventDate = new Date(group.eventStartDate);
    return eventDate < now;
  });

  const renderTickets = (bookingGroupsList: typeof bookingGroups) => {
    if (bookingGroupsList.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-neutral-400 mb-4">
            <svg
              className="mx-auto h-24 w-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <h3 className="text-neutral-900 mb-2">{t('booking.myTickets.noTickets')}</h3>
          <p className="text-neutral-600">
            {activeTab === "upcoming"
              ? t('booking.myTickets.noUpcoming')
              : t('booking.myTickets.noPast')}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {bookingGroupsList.map((group) => (
          <div key={group.bookingId}>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="mb-1">{group.eventTitle}</h3>
                <Badge variant="secondary" className="text-xs">
                  {group.tickets.length} {group.tickets.length === 1 ? t('booking.myTickets.ticket') : t('booking.myTickets.tickets')}
                </Badge>
              </div>
              <p className="text-sm text-neutral-500">
                {t('booking.myTickets.booking')} {group.bookingNumber} •{" "}
                {new Date(group.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {group.eventVenue} • {new Date(group.eventStartDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <button
                onClick={() => onNavigate("order-detail", group.bookingId?.toString() || group.bookingNumber)}
                className="text-sm text-teal-600 hover:text-teal-700 underline"
              >
                {t('booking.myTickets.viewOrderDetails')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.tickets.map((ticket) => (
                <QRTicketCard
                  key={ticket.ticketId}
                  ticket={{
                    id: ticket.ticketId.toString(),
                    tierId: ticket.ticketId.toString(),
                    tierName: ticket.ticketTypeName,
                    price: ticket.price,
                    qrCode: ticket.qrCode || ticket.ticketNumber,
                    status: ticket.status.toLowerCase() as 'valid' | 'used' | 'cancelled',
                    seatInfo: ticket.seatNumber || undefined,
                    checkInTime: ticket.usedAt || undefined,
                  }}
                  eventTitle={group.eventTitle}
                  eventDate={group.eventStartDate}
                  eventVenue={group.eventVenue}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Show loading state với skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-neutral-200">
                <Skeleton className="h-6 w-64 mb-4" />
                <Skeleton className="h-4 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state (only if there's an actual error, not just empty tickets)
  if (error && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTickets}
            className="text-teal-500 hover:text-teal-600"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="mb-8">{t('booking.myTickets.title')}</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="upcoming">
              {t('booking.myTickets.upcoming')} ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">{t('booking.myTickets.past')} ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {renderTickets(upcomingBookings)}
          </TabsContent>

          <TabsContent value="past">{renderTickets(pastBookings)}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
