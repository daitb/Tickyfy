import { Calendar, MapPin } from 'lucide-react';
import { Event } from '../../types';

interface RelatedEventsProps {
  currentEventId: string;
  relatedEvents: Event[];
  onEventClick: (eventId: string) => void;
}

export default function RelatedEvents({ currentEventId, relatedEvents, onEventClick }: RelatedEventsProps) {
  const filteredEvents = relatedEvents.filter(event => event.id !== currentEventId).slice(0, 3);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (filteredEvents.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl text-gray-900 mb-6">You Might Also Like</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredEvents.map(event => {
          const minPrice = Math.min(...event.ticketTiers.map(t => t.price));
          
          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event.id)}
              className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 px-3 py-1 bg-[#00C16A] text-white text-sm rounded-full">
                  From {formatPrice(minPrice)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-gray-900 mb-3 line-clamp-2">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#00C16A]" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#00C16A]" />
                    <span className="line-clamp-1">{event.venue}, {event.city}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
