import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  MapPin,
  Download,
  Printer,
  Check,
  Clock,
  ChevronRight,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import type { Order } from "../types";
import { eventService } from "../services/eventService";
import { ticketService } from "../services/ticketService";
import { getPaymentsByBooking } from "../services/paymentService";
import type { Event } from "../types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { toast } from "sonner";

interface OrderDetailProps {
  orderId?: string;
  orders?: Order[];
  onNavigate: (page: string, eventId?: string) => void;
}

interface PaymentInfo {
  id: number;
  bookingId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
  paymentGateway?: string;
}

export function OrderDetail({ orderId, orders, onNavigate }: OrderDetailProps) {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);

  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderId) {
        setError("Order ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get tickets for this booking/order
        const userTickets = await ticketService.getMyTickets();
        
        const orderTickets = userTickets.filter((t: any) => 
          t.bookingId?.toString() === orderId || 
          t.bookingNumber === orderId
        );
        
        if (orderTickets.length === 0) {
          const errorMsg = `Không tìm thấy vé cho đơn hàng ${orderId}. Đơn hàng có thể chưa được xác nhận hoặc vé chưa được tạo.`;
          setError(errorMsg);
          toast.error(errorMsg);
          setIsLoading(false);
          return;
        }

        setTickets(orderTickets);
        
        // Load event details from first ticket
        const firstTicket = orderTickets[0];
        if (firstTicket?.eventId) {
          try {
            const eventData = await eventService.getEventById(Number(firstTicket.eventId));
            setEvent(eventData);
          } catch (err) {
            // If event load fails, create a minimal event object from ticket data
            if (firstTicket.eventTitle) {
              setEvent({
                id: firstTicket.eventId.toString(),
                title: firstTicket.eventTitle,
                venue: firstTicket.eventVenue || "Venue TBD",
                city: "",
                date: firstTicket.eventStartDate || new Date().toISOString(),
                time: "",
                image: "",
                description: "",
                category: "",
                price: firstTicket.price || 0,
                capacity: 0,
                available: 0,
              } as unknown as Event);
            }
          }
        } else if (firstTicket?.eventTitle) {
          // Create event from ticket data if eventId is missing
          setEvent({
            id: firstTicket.eventId?.toString() || "",
            title: firstTicket.eventTitle,
            venue: firstTicket.eventVenue || "Venue TBD",
            city: "",
            date: firstTicket.eventStartDate || new Date().toISOString(),
            time: "",
            image: "",
            description: "",
            category: "",
            price: firstTicket.price || 0,
            capacity: 0,
            available: 0,
          } as unknown as Event);
        }
        
        // Load payment information
        try {
          const paymentData = await getPaymentsByBooking(Number(orderId));
          if (Array.isArray(paymentData)) {
            setPayments(paymentData);
          } else if (paymentData) {
            setPayments([paymentData]);
          }
        } catch (err) {
          // Payment info is optional, don't show error to user
        }
      } catch (err: any) {
        const errorMsg = err.message || "Không thể tải thông tin đơn hàng. Vui lòng thử lại.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-600">Loading order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tickets.length) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <h2 className="text-neutral-900 mb-4">{error || "Order not found"}</h2>
            <p className="text-neutral-600 mb-4">
              {!tickets.length && !error && "No tickets found for this booking. Please ensure the booking is confirmed and tickets have been created."}
            </p>
            <Button onClick={() => onNavigate("my-tickets")}>
              Back to My Tickets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-600">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Create order object from tickets for compatibility
  const firstTicket = tickets[0];
  const currentOrder = {
    id: orderId,
    eventId: firstTicket.eventId?.toString() || "",
    tickets: tickets.map((t: any) => ({
      id: t.ticketId?.toString() || t.id?.toString(),
      tierName: t.ticketTypeName || "General",
      price: t.price || 0,
      status: t.status?.toLowerCase() || "valid",
      seatInfo: t.seatNumber || undefined,
      qrCode: t.qrCode || t.ticketNumber,
      checkInTime: t.usedAt || t.checkedInAt || undefined,
    })),
    total: tickets.reduce((sum: number, t: any) => sum + (t.price || 0), 0),
    subtotal: tickets.reduce((sum: number, t: any) => sum + (t.price || 0), 0),
    serviceFee: 0,
    status: "completed" as const,
    createdAt: firstTicket.createdAt || new Date().toISOString(),
    paymentMethod: payments[0]?.paymentMethod || payments[0]?.paymentGateway || undefined,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (timeString) {
      return `${formattedDate} • ${timeString}`;
    }
    return formattedDate;
  };

  const formatPrice = (price: number) => {
    return `${(price / 1000).toFixed(0)}K VND`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  const timelineSteps = [
    {
      title: t("pages.orderDetail.timeline.orderPlaced"),
      timestamp: formatDate(currentOrder.createdAt),
      completed: true,
    },
    {
      title: t("pages.orderDetail.timeline.paymentConfirmed"),
      timestamp: formatDate(currentOrder.createdAt),
      completed: currentOrder.status === "completed",
    },
    {
      title: t("pages.orderDetail.timeline.ticketsIssued"),
      timestamp: formatDate(currentOrder.createdAt),
      completed: currentOrder.status === "completed",
    },
    {
      title: t("pages.orderDetail.timeline.eventCheckIn"),
      timestamp: t("common.notYet"),
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
          <button
            onClick={() => onNavigate("home")}
            className="hover:text-teal-600"
          >
            Home
          </button>
          <ChevronRight size={16} />
          <button
            onClick={() => onNavigate("my-tickets")}
            className="hover:text-teal-600"
          >
            My Orders
          </button>
          <ChevronRight size={16} />
          <span className="text-neutral-900">Order #{currentOrder.id}</span>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-6 p-6">
              {/* Event Image */}
              <div className="md:w-96 flex-shrink-0">
                <div className="aspect-[16/10] rounded-lg overflow-hidden bg-neutral-100">
                  {event.image ? (
                    <ImageWithFallback
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200">
                      <div className="text-center text-teal-600">
                        <svg
                          className="mx-auto h-16 w-16 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        <p className="text-sm font-medium">{event.title}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="mb-2">{event.title}</h1>
                  <div className="flex items-center gap-2 text-neutral-600 mb-2">
                    <Calendar size={18} />
                    <span>{formatDateTime(event.date, event.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <MapPin size={18} />
                    <span>
                      {event.venue}, {event.city}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Order #{currentOrder.id}</Badge>
                  <Badge className={getStatusColor(currentOrder.status)}>
                    {currentOrder.status === "completed"
                      ? "Confirmed"
                      : currentOrder.status}
                  </Badge>
                  {currentOrder.paymentMethod && (
                    <Badge variant="outline">
                      {currentOrder.paymentMethod}
                    </Badge>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="text-neutral-600 mb-1">Total Paid</div>
                  <div className="text-teal-600">
                    {formatPrice(currentOrder.total)}
                  </div>
                </div>
                
                {payments.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-neutral-600 mb-2">
                        <CreditCard size={16} />
                        <span className="text-sm font-medium">Payment Information</span>
                      </div>
                      {payments.map((payment) => (
                        <div key={payment.id} className="text-sm space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-600">Status:</span>
                            <Badge 
                              className={
                                payment.status === "Completed" 
                                  ? "bg-green-100 text-green-700"
                                  : payment.status === "Failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-600">Method:</span>
                            <span className="text-neutral-900">
                              {payment.paymentMethod || payment.paymentGateway || 'N/A'}
                            </span>
                          </div>
                          {payment.transactionId && (
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-600">Transaction ID:</span>
                              <span className="text-neutral-700 font-mono text-xs">
                                {payment.transactionId}
                              </span>
                            </div>
                          )}
                          {payment.paidAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-600">Paid At:</span>
                              <span className="text-neutral-700 text-xs">
                                {new Date(payment.paidAt).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2>Your Tickets ({currentOrder.tickets.length})</h2>
            <Button variant="secondary" size="sm">
              <Download size={16} className="mr-2" />
              Download All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentOrder.tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => onNavigate("ticket-detail", ticket.id)}
              >
                <CardHeader className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {ticket.tierName}
                    </Badge>
                    <Badge className="bg-white text-indigo-600">
                      {ticket.status}
                    </Badge>
                  </div>
                  {ticket.seatInfo && (
                    <p className="text-sm text-white/90">{ticket.seatInfo}</p>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-teal-600">
                      {formatPrice(ticket.price)}
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="bg-neutral-50 rounded-lg p-6 mb-4 flex items-center justify-center">
                    <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-28 h-28 text-neutral-300"
                          viewBox="0 0 100 100"
                          fill="currentColor"
                        >
                          <rect x="0" y="0" width="40" height="40" />
                          <rect x="60" y="0" width="40" height="40" />
                          <rect x="0" y="60" width="40" height="40" />
                          <rect x="50" y="50" width="15" height="15" />
                          <rect x="75" y="75" width="10" height="10" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        // Handle view details
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        // Handle download
                      }}
                    >
                      <Download size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timelineSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-green-100 text-green-600"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {step.completed ? (
                        <Check size={20} />
                      ) : (
                        <Clock size={20} />
                      )}
                    </div>
                    {index < timelineSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-12 ${
                          step.completed ? "bg-green-200" : "bg-neutral-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="font-medium text-neutral-900">
                      {step.title}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {step.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1 sm:flex-none"
            onClick={() => onNavigate("event-detail", event.id)}
          >
            <ExternalLink size={16} className="mr-2" />
            View Event Details
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            Contact Support
          </Button>
          <Button variant="ghost" className="flex-1 sm:flex-none">
            <Printer size={16} className="mr-2" />
            Print All Tickets
          </Button>
        </div>
      </div>
    </div>
  );
}
