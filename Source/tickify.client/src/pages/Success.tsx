import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { CheckCircle, Download, Mail, Calendar, MapPin, Ticket, Info, Share2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { QRTicketCard } from '../components/QRTicketCard';
import { Separator } from '../components/ui/separator';
import type { OrderTicket } from '../types';
import { useBooking } from '../contexts/BookingContext';
import { bookingService } from '../services/bookingService';
import type { BookingDetailDto } from '../services/bookingService';
import { ticketService } from '../services/ticketService';
import type { TicketDto } from '../services/ticketService';
import { toast } from 'sonner';

interface SuccessProps {
  bookingId?: number;
  onNavigate: (page: string) => void;
}

export function Success({ bookingId, onNavigate }: SuccessProps) {
  const { t } = useTranslation();
  const { bookingState } = useBooking();
  const [booking, setBooking] = useState<BookingDetailDto | null>(null);
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use bookingId from props or from context
  const currentBookingId = bookingId || bookingState.bookingId;

  useEffect(() => {
    if (!currentBookingId) {
      setError('No booking found');
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const bookingDetails = await bookingService.getBookingById(currentBookingId);
        setBooking(bookingDetails);

        // Fetch tickets for this booking
        const bookingTickets = await bookingService.getBookingTickets(currentBookingId);
        // Convert to TicketDto format for display
        const ticketDetails = await Promise.all(
          bookingTickets.map(async (bt) => {
            try {
              return await ticketService.getTicketById(bt.ticketId);
            } catch (err) {
              console.error('Error fetching ticket:', err);
              return null;
            }
          })
        );
        setTickets(ticketDetails.filter((t): t is TicketDto => t !== null));
        setError(null);
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        setError(err.response?.data?.message || 'Failed to load booking details');
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [currentBookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No Booking Found</h2>
          <p className="text-neutral-600 mb-6">{error || 'Unable to load booking details'}</p>
          <Button onClick={() => onNavigate('home')} className="bg-teal-500 hover:bg-teal-600">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4 animate-in zoom-in duration-300">
            <CheckCircle className="text-teal-600" size={40} />
          </div>
          <h1 className="mb-3">Booking Confirmed!</h1>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Your tickets have been sent to <strong className="text-neutral-900">{booking.userEmail}</strong>
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="text-teal-500" size={20} />
                <h3>Order Confirmation</h3>
              </div>
              <p className="text-sm text-neutral-500">
                Booking Number: <span className="font-mono text-neutral-900">{booking.bookingNumber}</span>
              </p>
              <p className="text-sm text-neutral-500">
                {formatDateTime(booking.bookingDate)}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Download Receipt
            </Button>
          </div>

          {/* Event Details */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 mb-6">
            <h4 className="mb-4">Event Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="text-teal-500 mt-1 flex-shrink-0" size={20} />
                <div>
                  <div className="text-sm text-neutral-600">Date & Time</div>
                  <div className="text-neutral-900">{formatDate(booking.eventStartDate)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-teal-500 mt-1 flex-shrink-0" size={20} />
                <div>
                  <div className="text-sm text-neutral-600">Venue</div>
                  <div className="text-neutral-900">{booking.eventVenue}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Order Breakdown */}
          <div>
            <h4 className="mb-4">Order Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({booking.quantity} {booking.quantity === 1 ? 'ticket' : 'tickets'})</span>
                <span>{formatPrice(booking.subTotal)}</span>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {booking.promoCode && `(${booking.promoCode})`}</span>
                  <span>-{formatPrice(booking.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-neutral-900 font-semibold">
                <span>Total Paid</span>
                <span>{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h4 className="text-blue-900 mb-2">Check Your Email</h4>
              <p className="text-sm text-blue-700 mb-3">
                A confirmation email has been sent to <strong>{booking.userEmail}</strong>. 
                Please check your inbox (and spam folder) for your ticket details.
              </p>
              <p className="text-sm text-blue-700">
                Your tickets are also available in "My Tickets" section.
              </p>
            </div>
          </div>
        </div>

        {/* Booking Tickets */}
        {booking.tickets && booking.tickets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2>Your Tickets</h2>
              <p className="text-sm text-neutral-600">
                {booking.tickets.length} {booking.tickets.length === 1 ? 'ticket' : 'tickets'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="space-y-4">
                {booking.tickets.map((ticket, index) => (
                  <div key={ticket.ticketId} className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-neutral-500">Ticket #{index + 1}</div>
                        <div className="font-semibold text-neutral-900">{ticket.ticketNumber}</div>
                        <div className="text-sm text-neutral-600 mt-1">
                          {ticket.ticketTypeName}
                          {ticket.seatNumber && ` • Seat ${ticket.seatNumber}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-neutral-900 font-semibold">{formatPrice(ticket.price)}</div>
                        <Badge 
                          className={`mt-2 ${
                            ticket.status === 'Valid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Full Tickets with QR (if available) */}
        {tickets.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4">Ticket QR Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map((ticket) => {
                // Convert TicketDto to OrderTicket format for QRTicketCard
                const orderTicket: OrderTicket = {
                  id: ticket.ticketId.toString(),
                  tierId: ticket.ticketTypeName,
                  tierName: ticket.ticketTypeName,
                  price: ticket.price,
                  qrCode: ticket.qrCode || ticket.ticketNumber,
                  status: ticket.status === 'Valid' ? 'valid' : ticket.status === 'Used' ? 'used' : 'cancelled',
                  seatInfo: ticket.seatNumber,
                  checkInTime: ticket.usedAt,
                };
                return (
                  <QRTicketCard
                    key={ticket.ticketId}
                    ticket={orderTicket}
                    eventTitle={booking.eventTitle}
                    eventDate={booking.eventStartDate}
                    eventVenue={booking.eventVenue}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Info className="text-teal-500 mt-0.5 flex-shrink-0" size={20} />
            <h4>{t('booking.success.whatsNext')}</h4>
          </div>
          <ul className="space-y-3 text-sm text-neutral-600 ml-8">
            <li className="flex items-start gap-2">
              <span className="text-teal-500">1.</span>
              <span>{t('booking.success.step1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">2.</span>
              <span>{t('booking.success.step2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">3.</span>
              <span>{t('booking.success.step3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">4.</span>
              <span>{t('booking.success.step4')}</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => onNavigate('my-tickets')}
            size="lg"
            className="bg-teal-500 hover:bg-teal-600"
          >
            <Ticket size={20} className="mr-2" />
            {t('booking.success.viewAllMyTickets')}
          </Button>
          <Button
            onClick={() => onNavigate('home')}
            variant="outline"
            size="lg"
          >
            {t('booking.success.discoverMore')}
          </Button>
        </div>

        {/* Share */}
        <div className="text-center mt-8">
          <p className="text-sm text-neutral-500 mb-3">{t('booking.success.excited')}</p>
          <Button variant="ghost" size="sm" className="text-teal-600 hover:bg-teal-50">
            <Share2 size={16} className="mr-2" />
            {t('booking.success.shareWithFriends')}
          </Button>
        </div>
      </div>
    </div>
  );
}