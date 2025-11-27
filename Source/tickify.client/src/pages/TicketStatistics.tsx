import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Ticket,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ticketService, type TicketStatsDto, type TicketDto } from "../services/ticketService";
import { toast } from "sonner";

interface TicketStatisticsProps {
  onNavigate: (page: string) => void;
}

export function TicketStatistics({ onNavigate }: TicketStatisticsProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<TicketStatsDto | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      const [statsData, ticketsData] = await Promise.all([
        ticketService.getMyTicketsStats(),
        ticketService.getMyTickets(),
      ]);

      setStats(statsData);
      // Get 5 most recent tickets
      setRecentTickets(ticketsData.slice(0, 5));
    } catch (err: any) {
      console.error("[TicketStatistics] Failed to load statistics:", err);
      toast.error("Failed to load ticket statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStatistics();
    setIsRefreshing(false);
    toast.success("Statistics refreshed");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "valid":
        return "bg-green-100 text-green-700";
      case "used":
        return "bg-gray-100 text-gray-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "refunded":
        return "bg-blue-100 text-blue-700";
      case "expired":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-teal-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-neutral-600 mb-4">Failed to load statistics</p>
          <Button onClick={loadStatistics}>Try Again</Button>
        </div>
      </div>
    );
  }

  const activeRate = stats.totalTickets > 0
    ? ((stats.validTickets / stats.totalTickets) * 100).toFixed(1)
    : 0;

  const usageRate = stats.totalTickets > 0
    ? ((stats.usedTickets / stats.totalTickets) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Ticket Statistics
            </h1>
            <p className="text-neutral-600">
              Overview of your ticket activity and status
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <RefreshCw className="mr-2" size={16} />
            )}
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">
                Total Tickets
              </CardTitle>
              <Ticket className="h-4 w-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.totalTickets}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                All time purchases
              </p>
            </CardContent>
          </Card>

          {/* Valid Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">
                Valid Tickets
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.validTickets}
              </div>
              <div className="flex items-center text-xs text-neutral-500 mt-1">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                {activeRate}% active rate
              </div>
            </CardContent>
          </Card>

          {/* Used Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">
                Used Tickets
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.usedTickets}
              </div>
              <div className="flex items-center text-xs text-neutral-500 mt-1">
                <TrendingDown className="mr-1 h-3 w-3 text-blue-500" />
                {usageRate}% usage rate
              </div>
            </CardContent>
          </Card>

          {/* Cancelled Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">
                Cancelled
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.cancelledTickets}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Refunded or cancelled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No tickets found
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.ticketId}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    onClick={() => onNavigate("ticket-detail")}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-900">
                        {ticket.eventTitle}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-neutral-500">
                          {ticket.ticketTypeName}
                        </span>
                        {ticket.seatNumber && (
                          <>
                            <span className="text-neutral-300">•</span>
                            <span className="text-sm text-neutral-500">
                              Seat: {ticket.seatNumber}
                            </span>
                          </>
                        )}
                        <span className="text-neutral-300">•</span>
                        <span className="text-sm text-neutral-500">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate("my-tickets")}
              >
                View All Tickets
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate("my-tickets")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <Ticket className="h-12 w-12 mx-auto mb-3 text-teal-500" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  My Tickets
                </h3>
                <p className="text-sm text-neutral-600">
                  View all your purchased tickets
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate("home")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-purple-500" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Browse Events
                </h3>
                <p className="text-sm text-neutral-600">
                  Discover new events to attend
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate("user-profile")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Transfer History
                </h3>
                <p className="text-sm text-neutral-600">
                  View ticket transfer history
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

