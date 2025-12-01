import { Calendar, MapPin } from 'lucide-react';
import React, { useMemo } from 'react';
import type { Event } from '../types';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WishlistButton } from './WishlistButton';
import { authService } from '../services/authService';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

/**
 * EventCard component với memoization để tránh re-render không cần thiết
 * Chỉ re-render khi event data hoặc onClick handler thay đổi
 */
export const EventCard = React.memo(function EventCard({ event, onClick }: EventCardProps) {
  const isAuthenticated = authService.isAuthenticated();
  const eventId = useMemo(() => parseInt(event.id, 10), [event.id]);

  const formatCompactPrice = (price: number) => {
    if (price <= 0) return "0k";
    const compactValue = price / 1000;
    const formatted = compactValue % 1 === 0
      ? compactValue.toFixed(0)
      : compactValue.toFixed(1);
    return `${formatted.replace(/\.0$/, "")}k`;
  };

  // Memoize expensive calculations
  const lowestPrice = useMemo(() => {
    const availableTiers = event.ticketTiers.filter(t => t.available > 0);
    if (availableTiers.length === 0) return 0;
    return Math.min(...availableTiers.map(t => t.price));
  }, [event.ticketTiers]);

  const formattedDate = useMemo(() => {
    const date = new Date(event.date);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }, [event.date]);
  const formatPriceRange = (min: number, max: number) => {
    if (min <= 0 && max <= 0) return "TBD";

    const minText = min > 0 ? formatCompactPrice(min) : null;
    const maxText = max > 0 ? formatCompactPrice(max) : null;

    if (minText && maxText && max !== min) {
      return `${minText} - ${maxText} VND`;
    }

    if (minText) {
      return `${minText} VND`;
    }

    return maxText ? `${maxText} VND` : "TBD";
  };

  // Get lowest and highest price from available tickets
  const availableTickets = event.ticketTiers.filter(t => t.available > 0);
  const ticketsToUse = availableTickets.length > 0 ? availableTickets : event.ticketTiers;
  
  const lowestPrice = ticketsToUse.length > 0
    ? Math.min(...ticketsToUse.map(t => t.price))
    : 0;
  const highestPrice = ticketsToUse.length > 0
    ? Math.max(...ticketsToUse.map(t => t.price))
    : 0;

  // Debug: Log prices to console
  console.log('Event:', event.title, 'TicketTiers:', event.ticketTiers, 'Min:', lowestPrice, 'Max:', highestPrice);

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100 relative">
        <ImageWithFallback
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isAuthenticated && (
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton
              eventId={eventId}
              size="md"
            />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-neutral-100">
            {event.category}
          </Badge>
        </div>
        <h3 className="mb-1 line-clamp-2 min-h-[3em]">
          {event.title}
        </h3>
        <div className="space-y-2 text-neutral-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span className="text-sm">{event.city}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-neutral-500 text-sm">From</span>
          <span className="text-teal-600 font-semibold">{formatPriceRange(lowestPrice, highestPrice)}</span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function để optimize re-renders
  // Chỉ re-render nếu event data hoặc onClick thay đổi
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.title === nextProps.event.title &&
    prevProps.event.image === nextProps.event.image &&
    prevProps.event.date === nextProps.event.date &&
    prevProps.event.category === nextProps.event.category &&
    prevProps.event.city === nextProps.event.city &&
    JSON.stringify(prevProps.event.ticketTiers) === JSON.stringify(nextProps.event.ticketTiers) &&
    prevProps.onClick === nextProps.onClick
  );
});
