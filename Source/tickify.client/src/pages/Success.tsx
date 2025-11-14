import { CheckCircle, Download, Mail, Calendar, MapPin, Ticket, Info, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { QRTicketCard } from '../components/QRTicketCard';
import { Separator } from '../components/ui/separator';
import type { Order } from '../types';
import { mockEvents } from '../mockData';

interface SuccessProps {
  order: Order | null;
  onNavigate: (page: string) => void;
}

export function Success({ order, onNavigate }: SuccessProps) {
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2>No order found</h2>
          <Button onClick={() => onNavigate('home')} className="mt-4">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const event = mockEvents.find(e => e.id === order.eventId);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4 animate-in zoom-in duration-300">
            <CheckCircle className="text-teal-600" size={40} />
          </div>
          <h1 className="mb-3">Payment Successful!</h1>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Your tickets have been confirmed and sent to <strong className="text-neutral-900">{order.userEmail}</strong>
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
                Order ID: <span className="font-mono text-neutral-900">{order.id}</span>
              </p>
              <p className="text-sm text-neutral-500">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Download Receipt
            </Button>
          </div>

          {/* Event Details */}
          {event && (
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 mb-6">
              <h4 className="mb-4">Event Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="text-teal-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <div className="text-sm text-neutral-600">Date & Time</div>
                    <div className="text-neutral-900">{formatDate(event.date)}</div>
                    <div className="text-neutral-600">{event.time}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="text-teal-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <div className="text-sm text-neutral-600">Venue</div>
                    <div className="text-neutral-900">{event.venue}</div>
                    <div className="text-neutral-600">{event.city}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Order Breakdown */}
          <div>
            <h4 className="mb-4">Order Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({order.tickets.length} {order.tickets.length === 1 ? 'ticket' : 'tickets'})</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Service Fee</span>
                <span>{formatPrice(order.serviceFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-neutral-900">
                <span>Total Paid</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h4 className="text-blue-900 mb-2">Check your email</h4>
              <p className="text-sm text-blue-700 mb-3">
                We've sent your tickets and receipt to <strong>{order.userEmail}</strong>. 
                Make sure to check your spam folder if you don't see it within a few minutes.
              </p>
              <p className="text-sm text-blue-700">
                Your tickets are also available in the "My Tickets" section of your account.
              </p>
            </div>
          </div>
        </div>

        {/* QR Tickets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2>Your Tickets</h2>
            <p className="text-sm text-neutral-600">
              {order.tickets.length} {order.tickets.length === 1 ? 'Ticket' : 'Tickets'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {order.tickets.map((ticket) => (
              <QRTicketCard
                key={ticket.id}
                ticket={ticket}
                eventTitle={event?.title || 'Event'}
                eventDate={event?.date || ''}
                eventVenue={event?.venue || ''}
              />
            ))}
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Info className="text-teal-500 mt-0.5 flex-shrink-0" size={20} />
            <h4>What's Next?</h4>
          </div>
          <ul className="space-y-3 text-sm text-neutral-600 ml-8">
            <li className="flex items-start gap-2">
              <span className="text-teal-500">1.</span>
              <span>Save your tickets to your phone or print them out</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">2.</span>
              <span>Arrive at the venue early to avoid queues</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">3.</span>
              <span>Present your QR code at the entrance for scanning</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">4.</span>
              <span>Bring a valid ID that matches the name on your ticket</span>
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
            View All My Tickets
          </Button>
          <Button
            onClick={() => onNavigate('home')}
            variant="outline"
            size="lg"
          >
            Discover More Events
          </Button>
        </div>

        {/* Share */}
        <div className="text-center mt-8">
          <p className="text-sm text-neutral-500 mb-3">Excited about this event?</p>
          <Button variant="ghost" size="sm" className="text-teal-600 hover:bg-teal-50">
            <Share2 size={16} className="mr-2" />
            Share with friends
          </Button>
        </div>
      </div>
    </div>
  );
}