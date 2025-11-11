import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

interface TicketDetailProps {
  onNavigate?: (page: string) => void;
}

interface TicketDetail {
  ticketId: number;
  ticketNumber: string;
  bookingId: number;
  bookingNumber: string;
  eventId: number;
  eventTitle: string;
  eventImage: string;
  eventVenue: string;
  eventStartDate: string;
  eventEndDate: string;
  ticketTypeName: string;
  price: number;
  seatId?: number;
  seatNumber?: string;
  status: string;
  qrCode?: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
}

export function TicketDetail({ onNavigate }: TicketDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/tickets/${id}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();

      // Mock data for now
      const mockTicket: TicketDetail = {
        ticketId: parseInt(id || "1"),
        ticketNumber: `TIX-2025-${id?.padStart(6, "0")}`,
        bookingId: 1,
        bookingNumber: "BK-2025-0001",
        eventId: 1,
        eventTitle: "Summer Music Festival 2025",
        eventImage:
          "https://images.unsplash.com/photo-1459749411175-04bf5292ceea",
        eventVenue: "Madison Square Garden, New York",
        eventStartDate: "2025-12-31T20:00:00",
        eventEndDate: "2025-12-31T23:59:00",
        ticketTypeName: "VIP",
        price: 75.0,
        seatNumber: "A12",
        status: "Valid",
        qrCode: "QR_CODE_BASE64_DATA_HERE",
        isUsed: false,
        createdAt: "2025-11-10T14:30:00",
      };

      setTicket(mockTicket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTicket = async () => {
    if (!transferEmail || !ticket) return;

    try {
      setTransferring(true);
      // TODO: Replace with actual API call
      // await fetch(`/api/tickets/${id}/transfer`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ toEmail: transferEmail })
      // });

      alert(
        `Transfer initiated to ${transferEmail}. They will receive an email to accept.`
      );
      setTransferEmail("");
    } catch (error) {
      console.error("Error transferring ticket:", error);
      alert("Failed to transfer ticket. Please try again.");
    } finally {
      setTransferring(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setResendingEmail(true);
      // TODO: Replace with actual API call
      // await fetch(`/api/tickets/${id}/resend-email`, {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      alert("Ticket email has been resent. Please check your inbox.");
    } catch (error) {
      console.error("Error resending email:", error);
      alert("Failed to resend email. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  const downloadQRCode = () => {
    // TODO: Implement QR code download
    alert("QR code download functionality coming soon!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Valid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Used":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Transferred":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <svg
                className="w-16 h-16 text-neutral-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Ticket not found
              </h3>
              <p className="text-neutral-600 mb-6">
                This ticket may not exist or has been transferred
              </p>
              <Button onClick={() => navigate("/my-tickets")}>
                Back to My Tickets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const canTransfer = ticket.status === "Valid" && !ticket.isUsed;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/order/${ticket.bookingId}`)}
            className="mb-4 -ml-3 hover:bg-transparent"
          >
            ← Back to Order
          </Button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="mb-2">Ticket Details</h1>
              <p className="text-neutral-600 font-mono text-sm">
                {ticket.ticketNumber}
              </p>
            </div>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <img
                    src={ticket.eventImage}
                    alt={ticket.eventTitle}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {ticket.eventTitle}
                    </h3>
                    <div className="space-y-1 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDate(ticket.eventStartDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{ticket.eventVenue}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate(`/event/${ticket.eventId}`)}
                    >
                      View Event Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Ticket Type</p>
                    <p className="font-semibold">{ticket.ticketTypeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Price</p>
                    <p className="font-semibold">
                      {formatCurrency(ticket.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Seat</p>
                    <p className="font-semibold">
                      {ticket.seatNumber || "General Admission"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Booking</p>
                    <p className="font-semibold font-mono text-sm">
                      {ticket.bookingNumber}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <p className="text-sm text-neutral-600 mb-1">Purchased On</p>
                  <p className="text-sm">{formatDate(ticket.createdAt)}</p>
                </div>

                {ticket.isUsed && ticket.usedAt && (
                  <div className="mt-3">
                    <p className="text-sm text-neutral-600 mb-1">Used At</p>
                    <p className="text-sm text-blue-600">
                      {formatDate(ticket.usedAt)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transfer Ticket */}
            {canTransfer && (
              <Card>
                <CardHeader>
                  <CardTitle>Transfer Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 mb-4">
                    Transfer this ticket to another person. They will receive an
                    email to accept the transfer.
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="transfer-email">Recipient Email</Label>
                      <Input
                        id="transfer-email"
                        type="email"
                        placeholder="recipient@example.com"
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleTransferTicket}
                        disabled={!transferEmail || transferring}
                      >
                        {transferring ? "Transferring..." : "Transfer"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-4 rounded-lg border mb-4 inline-block">
                  {ticket.qrCode ? (
                    <img
                      src={`data:image/png;base64,${ticket.qrCode}`}
                      alt="Ticket QR Code"
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 mx-auto mb-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                          />
                        </svg>
                        <p className="text-sm text-gray-500">
                          QR Code
                          <br />
                          Not Generated
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-500 mb-4">
                  Show this QR code at the venue entrance
                </p>

                <Dialog open={showQR} onOpenChange={setShowQR}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mb-2">
                      View Full Size
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Ticket QR Code</DialogTitle>
                      <DialogDescription>
                        {ticket.ticketNumber}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-4">
                      {ticket.qrCode && (
                        <img
                          src={`data:image/png;base64,${ticket.qrCode}`}
                          alt="Ticket QR Code"
                          className="w-64 h-64"
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={downloadQRCode}
                >
                  Download QR Code
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                >
                  {resendingEmail ? "Sending..." : "Resend Ticket Email"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.print()}
                >
                  Print Ticket
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/order/${ticket.bookingId}`)}
                >
                  View Order Details
                </Button>
              </CardContent>
            </Card>

            {/* Important Info */}
            <Card>
              <CardHeader>
                <CardTitle>Important Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                <ul className="list-disc list-inside space-y-1">
                  <li>Arrive 30 minutes before the event</li>
                  <li>Keep this ticket safe and secure</li>
                  <li>Screenshot or print for faster check-in</li>
                  <li>Valid ID may be required at venue</li>
                  <li>This ticket is non-refundable</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
