import { CheckCircle, Download, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { QRTicketCard } from '../components/QRTicketCard';
import { Order } from '../types';
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

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="mb-2">Order Confirmed!</h1>
          <p className="text-neutral-600 text-xl">
            Your tickets have been sent to <strong>{order.userEmail}</strong>
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="mb-1">Order #{order.id}</h3>
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

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Mail className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-700">
                <p className="mb-1">Check your email</p>
                <p>
                  We've sent your tickets and receipt to your email. Make sure to check your spam folder if you don't see it.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Tickets */}
        <div className="mb-8">
          <h2 className="mb-6">Your Tickets</h2>
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => onNavigate('my-tickets')}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600"
          >
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
      </div>
    </div>
  );
}
