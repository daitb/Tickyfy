import {
  Calendar,
  MapPin,
  Download,
  Printer,
  Share2,
  Wallet,
  ChevronRight,
  AlertCircle,
  Send,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Order, OrderTicket } from "../types";
import { mockEvents, mockOrders } from "../mockData";

interface TicketDetailProps {
  ticketId?: string;
  orders?: Order[];
  onNavigate: (page: string, id?: string) => void;
}

export function TicketDetail({
  ticketId,
  orders,
  onNavigate,
}: TicketDetailProps) {
  // Find ticket from orders list if not provided
  let currentTicket: any = null;
  let currentOrder: any = null;
  let currentEvent: any = null;

  if (ticketId && orders) {
    for (const order of orders) {
      const foundTicket = order.tickets.find((t) => t.id === ticketId);
      if (foundTicket) {
        currentTicket = foundTicket;
        currentOrder = order;
        currentEvent = mockEvents.find((e) => e.id === order.eventId);
        break;
      }
    }
  }

  // If not found, use first ticket from first order
  if (!currentTicket && orders && orders.length > 0) {
    currentOrder = orders[0];
    currentTicket = currentOrder.tickets[0];
    currentEvent = mockEvents.find((e) => e.id === currentOrder.eventId);
  }

  if (!currentTicket) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center py-16">
            <h2 className="text-neutral-900 mb-4">Ticket not found</h2>
            <Button onClick={() => onNavigate("my-tickets")}>
              Back to My Tickets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const formattedDate = formatDate(dateString);

    if (timeString) {
      return `${formattedDate} at ${timeString}`;
    }
    return formattedDate;
  };

  const formatPrice = (price: number) => {
    return `${(price / 1000).toFixed(0)}K VND`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            My Tickets
          </button>
          <ChevronRight size={16} />
          <span className="text-neutral-900">Ticket Details</span>
        </div>

        {/* Ticket Visual Card */}
        <Card className="mb-8 overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 border-0">
          <CardContent className="p-8 md:p-12 text-white relative">
            {/* Decorative pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <pattern
                  id="dots"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1" fill="currentColor" />
                </pattern>
                <rect width="100" height="100" fill="url(#dots)" />
              </svg>
            </div>

            <div className="relative z-10 space-y-6">
              {/* Event Info */}
              <div>
                <h1 className="text-white mb-4">
                  {currentEvent?.title || "Event Title"}
                </h1>
                <div className="space-y-2 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <span>
                      {formatDateTime(
                        currentEvent?.date || "",
                        currentEvent?.time
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>
                      {currentEvent?.venue || "Venue"},{" "}
                      {currentEvent?.city || "City"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/20" />

              {/* Ticket Info */}
              <div className="space-y-3">
                <div className="text-white/90">Ticket Holder</div>
                <div className="text-white">
                  {currentOrder?.userName || "Guest"}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-white text-indigo-600 text-base px-4 py-1">
                    {currentTicket.tierName}
                  </Badge>
                  {currentTicket.seatInfo && (
                    <span className="text-white/90">
                      {currentTicket.seatInfo}
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              <Card className="bg-white p-8 mt-8">
                <div className="text-center space-y-4">
                  {/* Large QR Code */}
                  <div className="inline-block p-6 bg-neutral-50 rounded-2xl">
                    <div className="w-72 h-72 md:w-80 md:h-80 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-64 h-64 md:w-72 md:h-72 text-neutral-900"
                        viewBox="0 0 100 100"
                        fill="currentColor"
                      >
                        {/* QR Code pattern */}
                        <rect x="0" y="0" width="20" height="20" />
                        <rect x="80" y="0" width="20" height="20" />
                        <rect x="0" y="80" width="20" height="20" />
                        <rect x="40" y="40" width="20" height="20" />
                        <rect x="25" y="25" width="5" height="5" />
                        <rect x="70" y="25" width="5" height="5" />
                        <rect x="25" y="70" width="5" height="5" />
                        <rect x="50" y="10" width="5" height="5" />
                        <rect x="10" y="50" width="5" height="5" />
                        <rect x="85" y="50" width="5" height="5" />
                        <rect x="50" y="85" width="5" height="5" />
                        <rect x="65" y="65" width="10" height="10" />
                        <rect x="30" y="55" width="5" height="5" />
                        <rect x="55" y="30" width="5" height="5" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-neutral-900 font-mono tracking-wider">
                      {currentTicket.qrCode}
                    </div>
                    <div className="text-sm text-neutral-600">
                      Valid until {formatDate(currentEvent?.date || "")} 11:59
                      PM
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-red-600 mt-4">
                      <AlertCircle size={16} />
                      <span>Do not share this QR code</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Details Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Order ID</span>
                  <span className="text-neutral-900 font-medium">
                    #{currentOrder?.id || "N/A"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-neutral-600">Purchase Date</span>
                  <span className="text-neutral-900 font-medium">
                    {currentOrder ? formatDate(currentOrder.createdAt) : "N/A"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-neutral-600">Price Paid</span>
                  <span className="text-teal-600 font-medium">
                    {formatPrice(currentTicket.price)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-neutral-600">Payment</span>
                  <span className="text-neutral-900 font-medium">
                    {currentOrder?.paymentMethod || "N/A"}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Entry Gate</span>
                  <span className="text-neutral-900 font-medium">Gate 3</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Check-in Status</span>
                  <Badge
                    variant={
                      currentTicket.checkInTime ? "default" : "secondary"
                    }
                  >
                    {currentTicket.checkInTime
                      ? `Checked in at ${currentTicket.checkInTime}`
                      : "Not Checked In"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-neutral-600">Admission Type</span>
                  <span className="text-neutral-900 font-medium">
                    General Admission
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Category</span>
                  <Badge variant="secondary">
                    {currentEvent?.category || "Event"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            className="w-full bg-teal-500 hover:bg-teal-600"
            onClick={() => onNavigate("transfer-ticket", currentTicket?.id)}
          >
            <Send size={16} className="mr-2" />
            Transfer
          </Button>
          <Button className="w-full">
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
          <Button variant="outline" className="w-full">
            <Printer size={16} className="mr-2" />
            Print
          </Button>
        </div>

        {/* Accordions */}
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem
            value="terms"
            className="bg-white rounded-lg border px-6"
          >
            <AccordionTrigger>Terms & Conditions</AccordionTrigger>
            <AccordionContent className="text-neutral-600 space-y-2">
              <p>• This ticket is valid for one-time entry only.</p>
              <p>
                • Ticket holder must present a valid ID matching the name on the
                ticket.
              </p>
              <p>
                • No refunds or exchanges after purchase unless the event is
                cancelled.
              </p>
              <p>
                • The organizer reserves the right to refuse entry without
                refund.
              </p>
              <p>
                • Photography and video recording may be prohibited during the
                event.
              </p>
              <p>• Lost or stolen tickets cannot be replaced.</p>
              <p>
                • Ticket is non-transferable without authorization from the
                organizer.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="event"
            className="bg-white rounded-lg border px-6"
          >
            <AccordionTrigger>Event Details</AccordionTrigger>
            <AccordionContent className="text-neutral-600 space-y-4">
              <div>
                <h4 className="text-neutral-900 mb-2">About this event</h4>
                <p>
                  {currentEvent?.description ||
                    "Event description not available."}
                </p>
              </div>
              {currentEvent?.fullDescription && (
                <div>
                  <h4 className="text-neutral-900 mb-2">Full Description</h4>
                  <p className="whitespace-pre-line">
                    {currentEvent.fullDescription}
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="venue"
            className="bg-white rounded-lg border px-6"
          >
            <AccordionTrigger>Venue Information</AccordionTrigger>
            <AccordionContent className="text-neutral-600 space-y-4">
              <div>
                <h4 className="text-neutral-900 mb-2">Location</h4>
                <p>
                  {currentEvent?.venueDetails?.fullAddress ||
                    `${currentEvent?.venue}, ${currentEvent?.city}`}
                </p>
              </div>
              {currentEvent?.venueDetails?.publicTransit && (
                <div>
                  <h4 className="text-neutral-900 mb-2">Public Transit</h4>
                  <p>{currentEvent.venueDetails.publicTransit}</p>
                </div>
              )}
              {currentEvent?.venueDetails?.parking && (
                <div>
                  <h4 className="text-neutral-900 mb-2">Parking</h4>
                  <p>{currentEvent.venueDetails.parking}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Help Link */}
        <div className="text-center mt-8">
          <button
            className="text-teal-600 hover:text-teal-700 transition-colors"
            onClick={() => {
              /* Handle contact support */
            }}
          >
            Need help? Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
}
