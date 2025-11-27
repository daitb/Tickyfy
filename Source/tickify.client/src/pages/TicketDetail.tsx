import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  MapPin,
  Download,
  Printer,
  Share2,
  ChevronRight,
  AlertCircle,
  Send,
  Mail,
  Loader2,
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
import { ticketService, type TicketDto, type QRCodeResponse } from "../services/ticketService";
import { toast } from "sonner";

interface TicketDetailProps {
  ticketId?: string;
  onNavigate: (page: string, id?: string) => void;
}

export function TicketDetail({
  ticketId,
  onNavigate,
}: TicketDetailProps) {
  const { t } = useTranslation();
  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [qrCode, setQrCode] = useState<QRCodeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    if (!ticketId) return;

    try {
      setIsLoading(true);
      const ticketData = await ticketService.getTicketById(parseInt(ticketId));
      setTicket(ticketData);
      setError("");
      
      // Load QR code
      loadQRCode(parseInt(ticketId));
    } catch (err: any) {
      console.error("[TicketDetail] Failed to load ticket:", err);
      setError(err.response?.data?.message || err.message || "Failed to load ticket");
      toast.error("Failed to load ticket details");
    } finally {
      setIsLoading(false);
    }
  };

  const loadQRCode = async (id: number) => {
    try {
      setIsLoadingQR(true);
      const qrData = await ticketService.getQRCode(id);
      setQrCode(qrData);
    } catch (err: any) {
      console.error("[TicketDetail] Failed to load QR code:", err);
      // Don't show error for QR code failure, just log it
    } finally {
      setIsLoadingQR(false);
    }
  };

  const handleResendEmail = async () => {
    if (!ticketId) return;

    try {
      setIsResendingEmail(true);
      await ticketService.resendEmail(parseInt(ticketId));
      toast.success("Ticket email resent successfully! Check your inbox.");
    } catch (err: any) {
      console.error("[TicketDetail] Failed to resend email:", err);
      toast.error(err.response?.data?.message || "Failed to resend email");
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!ticketId) return;

    try {
      await ticketService.downloadQRCode(parseInt(ticketId));
      toast.success("QR code downloaded successfully!");
    } catch (err: any) {
      console.error("[TicketDetail] Failed to download QR:", err);
      toast.error("Failed to download QR code");
    }
  };

  const handleShare = async () => {
    if (!ticket) return;

    const shareData = {
      title: ticket.eventTitle,
      text: `My ticket for ${ticket.eventTitle}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-teal-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-neutral-900 mb-4">
              {error || "Ticket not found"}
            </h2>
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "valid":
        return <Badge className="bg-green-500">Valid</Badge>;
      case "used":
        return <Badge className="bg-gray-500">Used</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case "refunded":
        return <Badge className="bg-blue-500">Refunded</Badge>;
      case "expired":
        return <Badge className="bg-orange-500">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
                <h1 className="text-white mb-4">{ticket.eventTitle}</h1>
                <div className="space-y-2 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <span>{formatDateTime(ticket.eventStartDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>{ticket.eventVenue}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/20" />

              {/* Ticket Info */}
              <div className="space-y-3">
                <div className="text-white/90">Ticket Information</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-white text-indigo-600 text-base px-4 py-1">
                    {ticket.ticketTypeName}
                  </Badge>
                  {ticket.seatNumber && (
                    <Badge className="bg-white/10 text-white border-white/20 text-base px-4 py-1">
                      Seat: {ticket.seatNumber}
                    </Badge>
                  )}
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              {/* QR Code Section */}
              <Card className="bg-white p-8 mt-8">
                <div className="text-center space-y-4">
                  {isLoadingQR ? (
                    <div className="w-72 h-72 md:w-80 md:h-80 bg-neutral-50 rounded-xl flex items-center justify-center">
                      <Loader2 className="animate-spin h-12 w-12 text-teal-500" />
                    </div>
                  ) : qrCode ? (
                    <div className="inline-block p-6 bg-neutral-50 rounded-2xl">
                      <div className="w-72 h-72 md:w-80 md:h-80 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                        <img
                          src={qrCode.qrCodeImage}
                          alt="Ticket QR Code"
                          className="w-full h-full object-contain p-4"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-72 h-72 md:w-80 md:h-80 bg-neutral-50 rounded-xl flex items-center justify-center">
                      <p className="text-neutral-500">QR code not available</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-neutral-900 font-mono tracking-wider">
                      {ticket.ticketNumber}
                    </div>
                    {ticket.status.toLowerCase() === "valid" && (
                      <div className="text-sm text-neutral-600">
                        Valid until {formatDate(ticket.eventEndDate)}
                      </div>
                    )}
                    {ticket.isUsed && ticket.usedAt && (
                      <div className="text-sm text-neutral-600">
                        Used on {formatDateTime(ticket.usedAt)}
                      </div>
                    )}
                    {ticket.status.toLowerCase() === "valid" && (
                      <div className="flex items-center justify-center gap-2 text-sm text-red-600 mt-4">
                        <AlertCircle size={16} />
                        <span>Do not share this QR code</span>
                      </div>
                    )}
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
                  <span className="text-neutral-600">Booking Number</span>
                  <span className="text-neutral-900 font-medium">
                    {ticket.bookingNumber}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-neutral-600">Ticket Number</span>
                  <span className="text-neutral-900 font-medium font-mono">
                    {ticket.ticketNumber}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-neutral-600">Purchase Date</span>
                  <span className="text-neutral-900 font-medium">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-neutral-600">Price</span>
                  <span className="text-teal-600 font-medium">
                    {formatPrice(ticket.price)}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Ticket Type</span>
                  <span className="text-neutral-900 font-medium">
                    {ticket.ticketTypeName}
                  </span>
                </div>
                <Separator />
                {ticket.seatNumber && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Seat Assignment</span>
                      <span className="text-neutral-900 font-medium">
                        {ticket.seatNumber}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Check-in Status</span>
                  {ticket.isUsed && ticket.usedAt ? (
                    <Badge className="bg-green-500">
                      Used on {new Date(ticket.usedAt).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Checked In</Badge>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Status</span>
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            className="w-full bg-teal-500 hover:bg-teal-600"
            onClick={() => onNavigate("transfer-ticket", ticketId)}
            disabled={ticket.status.toLowerCase() !== "valid"}
          >
            <Send size={16} className="mr-2" />
            Transfer
          </Button>
          <Button
            className="w-full"
            onClick={handleDownloadQR}
            disabled={!qrCode}
          >
            <Download size={16} className="mr-2" />
            Download QR
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleShare}
          >
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={isResendingEmail}
          >
            {isResendingEmail ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Mail size={16} className="mr-2" />
            )}
            Resend Email
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
                • Ticket holder must present a valid ID and this QR code at the
                venue entrance.
              </p>
              <p>
                • No refunds or exchanges after purchase unless the event is
                cancelled by the organizer.
              </p>
              <p>
                • The organizer reserves the right to refuse entry without
                refund for violation of terms.
              </p>
              <p>
                • Photography and video recording may be prohibited during the
                event.
              </p>
              <p>• Lost or stolen tickets cannot be replaced. Keep your QR code secure.</p>
              <p>
                • Tickets can be transferred to another user through the transfer
                feature, subject to approval.
              </p>
              <p>• Screenshots or copies of QR codes will be detected and rejected.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="event"
            className="bg-white rounded-lg border px-6"
          >
            <AccordionTrigger>Event Information</AccordionTrigger>
            <AccordionContent className="text-neutral-600 space-y-4">
              <div>
                <h4 className="text-neutral-900 mb-2">Event Name</h4>
                <p>{ticket.eventTitle}</p>
              </div>
              <div>
                <h4 className="text-neutral-900 mb-2">Date & Time</h4>
                <p>{formatDateTime(ticket.eventStartDate)}</p>
                {ticket.eventEndDate && (
                  <p className="text-sm mt-1">
                    Ends: {formatDateTime(ticket.eventEndDate)}
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-neutral-900 mb-2">Venue</h4>
                <p>{ticket.eventVenue}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="support"
            className="bg-white rounded-lg border px-6"
          >
            <AccordionTrigger>Help & Support</AccordionTrigger>
            <AccordionContent className="text-neutral-600 space-y-4">
              <div>
                <h4 className="text-neutral-900 mb-2">Need Help?</h4>
                <p>
                  If you have any questions or issues with your ticket, please
                  contact our support team.
                </p>
              </div>
              <div>
                <h4 className="text-neutral-900 mb-2">Ticket Number</h4>
                <p className="font-mono">{ticket.ticketNumber}</p>
                <p className="text-sm mt-1">
                  Please provide this number when contacting support.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  /* Navigate to support page */
                }}
              >
                Contact Support
              </Button>
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
