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
import { QRTicketCard } from "../components/QRTicketCard";
import { OrderTicket } from "../types";

interface OrderDetailProps {
  onNavigate?: (page: string) => void;
}

interface Booking {
  id: number;
  bookingCode: string;
  eventId: number;
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventVenue: string;
  totalAmount: number;
  discountAmount: number;
  status: "Pending" | "Confirmed" | "Cancelled" | "Refunded";
  bookingDate: string;
  expiresAt?: string;
  tickets: OrderTicket[];
  promoCode?: string;
}

export function OrderDetail({ onNavigate }: OrderDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/booking/${id}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();

      // Mock data for now
      const mockBooking: Booking = {
        id: parseInt(id || "1"),
        bookingCode: `BK-2025-${id?.padStart(4, "0")}`,
        eventId: 1,
        eventTitle: "Summer Music Festival 2025",
        eventImage:
          "https://images.unsplash.com/photo-1459749411175-04bf5292ceea",
        eventDate: "2025-12-31T20:00:00",
        eventVenue: "Madison Square Garden, New York",
        totalAmount: 150.0,
        discountAmount: 15.0,
        status: "Confirmed",
        bookingDate: "2025-11-10T14:30:00",
        promoCode: "SUMMER25",
        tickets: [
          {
            id: "1",
            tierId: "tier-vip-1",
            tierName: "VIP",
            price: 75.0,
            status: "valid",
            qrCode: "QR_CODE_DATA_1",
          },
          {
            id: "2",
            tierId: "tier-vip-1",
            tierName: "VIP",
            price: 75.0,
            status: "valid",
            qrCode: "QR_CODE_DATA_2",
          },
        ],
      };

      setBooking(mockBooking);
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (
      !booking ||
      !window.confirm(
        "Are you sure you want to cancel this booking? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      // TODO: Replace with actual API call
      // await fetch(`/api/booking/${id}/cancel`, {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      alert("Booking cancelled successfully");
      fetchBookingDetails(); // Refresh data
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "Refunded":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
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

  if (!booking) {
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Booking not found
              </h3>
              <p className="text-neutral-600 mb-6">
                This order may have been cancelled or doesn't exist
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

  const canCancel =
    booking.status === "Pending" || booking.status === "Confirmed";
  const finalAmount = booking.totalAmount - booking.discountAmount;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/my-tickets")}
            className="mb-4 -ml-3 hover:bg-transparent"
          >
            ← Back to My Tickets
          </Button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="mb-2">Order Details</h1>
              <p className="text-neutral-600">
                Booking Code:{" "}
                <span className="font-mono font-semibold">
                  {booking.bookingCode}
                </span>
              </p>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status}
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
                    src={booking.eventImage}
                    alt={booking.eventTitle}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {booking.eventTitle}
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
                        <span>{formatDate(booking.eventDate)}</span>
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
                        <span>{booking.eventVenue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Your Tickets ({booking.tickets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/ticket/${ticket.id}`)}
                      className="cursor-pointer"
                    >
                      <QRTicketCard
                        ticket={ticket}
                        eventTitle={booking.eventTitle}
                        eventDate={booking.eventDate}
                        eventVenue={booking.eventVenue}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </div>

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      Discount {booking.promoCode && `(${booking.promoCode})`}
                    </span>
                    <span className="font-semibold">
                      -{formatCurrency(booking.discountAmount)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(finalAmount)}</span>
                </div>

                <div className="text-xs text-neutral-500 mt-4">
                  <p>Booked on {formatDate(booking.bookingDate)}</p>
                  {booking.expiresAt && booking.status === "Pending" && (
                    <p className="text-orange-600 mt-1">
                      Expires: {formatDate(booking.expiresAt)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {canCancel && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Booking"}
                  </Button>
                  <p className="text-xs text-neutral-500">
                    {booking.status === "Pending"
                      ? "Cancel this booking to release your seats."
                      : "Cancelling will refund your payment and release the tickets."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-neutral-600">
                  If you have any questions about your order, please contact our
                  support team.
                </p>
                <Button variant="outline" className="w-full" size="sm">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
